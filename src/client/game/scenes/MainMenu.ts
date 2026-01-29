import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, InitGameResponse } from '../../../shared/types/game';
import { context } from '@devvit/web/client';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';
import { AudioManager } from '../utils/AudioManager';

// Admin usernames that can play unlimited times for testing
const ADMIN_USERNAMES = ['ashscars'];

export class MainMenu extends Scene {
  private noirBg: GameObjects.Graphics | null = null;
  private title: GameObjects.Text | null = null;
  private subtitle: GameObjects.Text | null = null;
  private caseTitle: GameObjects.Text | null = null;
  private startButton: GameObjects.Container | null = null;
  private viewResultButton: GameObjects.Container | null = null;
  private profileButton: GameObjects.Container | null = null;
  private instructions: GameObjects.Text | null = null;
  private footer: GameObjects.Text | null = null;
  private statusText: GameObjects.Text | null = null;
  private statusBadge: GameObjects.Graphics | null = null;

  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;

  constructor() {
    super('MainMenu');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  init(): void {
    this.noirBg = null;
    this.title = null;
    this.subtitle = null;
    this.caseTitle = null;
    this.startButton = null;
    this.viewResultButton = null;
    this.profileButton = null;
    this.instructions = null;
    this.footer = null;
    this.statusText = null;
    this.statusBadge = null;
  }

  async create() {
    await this.loadGameData();
    this.refreshLayout();
    this.scale.on('resize', () => this.scene.restart());

    // Start background music
    AudioManager.playMusic(this, 'bgmusic');
  }

  private async loadGameData(): Promise<void> {
    try {
      const response = await fetch('/api/game/init');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = (await response.json()) as InitGameResponse;
      this.currentCase = data.currentCase;
      this.progress = data.progress;
    } catch (error) {
      console.error('Failed to load game data:', error);
      this.progress = { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
    }
  }

  private isAdmin(): boolean {
    const username = context.username?.toLowerCase();
    return username ? ADMIN_USERNAMES.includes(username) : false;
  }

  private hasAlreadyPlayed(): boolean {
    if (this.isAdmin()) {
      return false;
    }
    return this.progress?.solved === true;
  }

  private wasCorrect(): boolean {
    return this.progress?.correct === true;
  }

  private async startGame(): Promise<void> {
    if (this.isAdmin() && this.progress?.solved) {
      try {
        await fetch('/api/game/reset', { method: 'POST' });
      } catch (error) {
        console.error('Failed to reset admin progress:', error);
      }
    }
    transitionToScene(this, 'CrimeScene');
  }

  private refreshLayout(): void {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    this.cameras.resize(width, height);

    const alreadyPlayed = this.hasAlreadyPlayed();
    const wasCorrect = this.wasCorrect();

    // Dark noir background with scanline effect
    if (!this.noirBg) {
      this.noirBg = this.add.graphics();
    }
    this.noirBg.clear();
    this.noirBg.fillStyle(0x0a0a14, 1);
    this.noirBg.fillRect(0, 0, width, height);

    // Scanlines
    const spacing = mobile ? 5 : 4;
    this.noirBg.lineStyle(1, 0x000000, 0.12);
    for (let y = 0; y < height; y += spacing) {
      this.noirBg.lineBetween(0, y, width, y);
    }

    // Glow color based on status
    const glowColor = alreadyPlayed ? (wasCorrect ? 0x003300 : 0x330000) : 0x330000;
    this.noirBg.fillStyle(glowColor, 0.25);
    this.noirBg.fillCircle(width / 2, height * 0.35, mobile ? 120 : 180);

    // Title
    if (!this.title) {
      this.title = createNoirText(this, width / 2, height * (mobile ? 0.14 : 0.16), 'REDDIT NOIR', {
        size: 'xlarge',
        color: 'red',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      this.title.setPosition(width / 2, height * (mobile ? 0.14 : 0.16));
    }

    // Subtitle
    if (!this.subtitle) {
      this.subtitle = createNoirText(this, width / 2, height * (mobile ? 0.22 : 0.24), 'THE DAILY MURDER MYSTERY', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      this.subtitle.setPosition(width / 2, height * (mobile ? 0.22 : 0.24));
    }

    // Decorative line
    this.noirBg.lineStyle(2, 0xff4444, 0.4);
    this.noirBg.lineBetween(width * 0.25, height * 0.29, width * 0.75, height * 0.29);

    // Case title
    const caseNum = this.currentCase?.dayNumber ?? 1;
    const caseTitle = this.currentCase?.title ?? "THE MODERATOR'S LAST BAN";
    const caseTitleText = `CASE #${String(caseNum).padStart(3, '0')}:\n${caseTitle.toUpperCase()}`;

    if (!this.caseTitle) {
      this.caseTitle = createNoirText(this, width / 2, height * (mobile ? 0.36 : 0.36), caseTitleText, {
        size: 'small',
        color: 'gold',
        origin: { x: 0.5, y: 0.5 },
        align: 1,
      });
    } else {
      this.caseTitle.setText(caseTitleText);
      this.caseTitle.setPosition(width / 2, height * (mobile ? 0.36 : 0.36));
    }

    // Status badge for returning players
    if (alreadyPlayed) {
      this.createAlreadyPlayedUI(width, height, mobile, wasCorrect);
    } else {
      this.createNewPlayerUI(width, height, mobile);
    }

    // Profile button (top right corner)
    if (!this.profileButton) {
      this.profileButton = createNoirButton(this, width - 70, 30, '[ PROFILE ]', {
        size: 'small',
        color: 'cyan',
        hoverColor: 'gold',
        onClick: () => this.goToProfile(),
        padding: { x: 12, y: 8 },
      });
    } else {
      this.profileButton.setPosition(width - 70, 30);
    }

    // Footer
    if (!this.footer) {
      this.footer = createNoirText(this, width / 2, height - 20, 'A REDDIT DEVVIT GAME', {
        size: 'small',
        color: 'darkGray',
        origin: { x: 0.5, y: 0.5 },
        scale: 0.7,
      });
    } else {
      this.footer.setPosition(width / 2, height - 20);
    }
  }

  private goToProfile(): void {
    transitionToScene(this, 'Profile');
  }

  private createNewPlayerUI(width: number, height: number, mobile: boolean): void {
    // Start button
    if (!this.startButton) {
      this.startButton = createNoirButton(this, width / 2, height * (mobile ? 0.52 : 0.52), '[ START ]', {
        size: 'large',
        color: 'green',
        hoverColor: 'cyan',
        onClick: () => this.startGame(),
        padding: { x: 30, y: 15 },
      });
    } else {
      this.startButton.setPosition(width / 2, height * (mobile ? 0.52 : 0.52));
    }
    this.startButton.setVisible(true);

    // Hide view result button if it exists
    if (this.viewResultButton) {
      this.viewResultButton.setVisible(false);
    }
    if (this.statusText) {
      this.statusText.setVisible(false);
    }
    if (this.statusBadge) {
      this.statusBadge.setVisible(false);
    }

    // Instructions
    const instructionText = mobile
      ? 'TAP CLUES - INTERROGATE - SOLVE'
      : 'EXAMINE CLUES - INTERROGATE SUSPECTS - SOLVE THE CASE';
    if (!this.instructions) {
      this.instructions = createNoirText(this, width / 2, height * (mobile ? 0.68 : 0.68), instructionText, {
        size: 'small',
        color: 'darkGray',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      this.instructions.setText(instructionText);
      this.instructions.setPosition(width / 2, height * (mobile ? 0.68 : 0.68));
    }
    this.instructions.setVisible(true);
  }

  private createAlreadyPlayedUI(width: number, height: number, mobile: boolean, wasCorrect: boolean): void {
    // Hide start button
    if (this.startButton) {
      this.startButton.setVisible(false);
    }

    // Status badge background
    if (!this.statusBadge) {
      this.statusBadge = this.add.graphics();
    }
    this.statusBadge.clear();
    this.statusBadge.setVisible(true);

    const badgeWidth = mobile ? width - 30 : 300;
    const badgeHeight = mobile ? 90 : 100;
    const badgeX = width / 2 - badgeWidth / 2;
    const badgeY = height * (mobile ? 0.42 : 0.44);

    this.statusBadge.fillStyle(wasCorrect ? 0x0a2a0a : 0x2a0a0a, 0.95);
    this.statusBadge.fillRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);
    this.statusBadge.lineStyle(3, wasCorrect ? 0x00ff00 : 0xff4444, 0.9);
    this.statusBadge.strokeRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);

    // Status text
    const statusMessage = wasCorrect
      ? 'CASE SOLVED\nYOU CAUGHT THE KILLER!'
      : 'CASE FAILED\nTHE KILLER GOT AWAY...';

    if (!this.statusText) {
      this.statusText = createNoirText(this, width / 2, badgeY + badgeHeight / 2, statusMessage, {
        size: 'medium',
        color: wasCorrect ? 'green' : 'red',
        origin: { x: 0.5, y: 0.5 },
        align: 1,
      });
    } else {
      this.statusText.setText(statusMessage);
      this.statusText.setPosition(width / 2, badgeY + badgeHeight / 2);
    }
    this.statusText.setVisible(true);

    // View Result button
    if (!this.viewResultButton) {
      this.viewResultButton = createNoirButton(this, width / 2, height * (mobile ? 0.70 : 0.70), '[ VIEW RESULT ]', {
        size: 'large',
        color: 'gold',
        hoverColor: 'white',
        onClick: () => this.goToResultScreen(),
        padding: { x: 25, y: 15 },
      });
    } else {
      this.viewResultButton.setPosition(width / 2, height * (mobile ? 0.70 : 0.70));
    }
    this.viewResultButton.setVisible(true);

    // Update instructions for returning players
    const instructionText = 'COME BACK TOMORROW FOR A NEW CASE!';
    if (!this.instructions) {
      this.instructions = createNoirText(this, width / 2, height * (mobile ? 0.82 : 0.82), instructionText, {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      this.instructions.setText(instructionText);
      this.instructions.setPosition(width / 2, height * (mobile ? 0.82 : 0.82));
    }
    this.instructions.setVisible(true);
  }

  private goToResultScreen(): void {
    if (!this.currentCase || !this.progress) return;

    const guiltySuspect = this.currentCase.suspects.find(s => s.isGuilty);
    const accusedSuspect = this.currentCase.suspects.find(s => s.id === this.progress?.accusedSuspect);

    const linkedClues = this.currentCase.clues.filter(c => c.linkedTo === guiltySuspect?.id);
    const evidence = linkedClues.map(c => c.name);

    transitionToScene(this, 'GameOver', {
      correct: this.progress.correct,
      accusedName: accusedSuspect?.name ?? 'Unknown',
      guiltyName: guiltySuspect?.name ?? 'Unknown',
      evidence: evidence,
      currentCase: this.currentCase,
      progress: this.progress,
    });
  }
}
