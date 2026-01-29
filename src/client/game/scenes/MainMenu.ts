import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, InitGameResponse, WeeklyCase, WeeklyProgress, ChapterStatus } from '../../../shared/types/game';
import { context } from '@devvit/web/client';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen, getScaleFactor } from '../utils/NoirText';
import { AudioManager } from '../utils/AudioManager';
import { GameStateManager } from '../utils/GameStateManager';

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

  // Weekly mode properties
  private isWeeklyMode: boolean = false;
  private weeklyCase: WeeklyCase | null = null;
  private weeklyProgress: WeeklyProgress | null = null;
  private chapterStatuses: ChapterStatus[] = [];
  private currentDayNumber: number = 1;

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
    // Reset weekly mode properties
    this.isWeeklyMode = false;
    this.weeklyCase = null;
    this.weeklyProgress = null;
    this.chapterStatuses = [];
    this.currentDayNumber = 1;
  }

  async create() {
    await this.loadGameData();
    this.refreshLayout();
    this.scale.on('resize', () => this.scene.restart());

    // Start background music
    AudioManager.playMusic(this, 'bgmusic');
  }

  private async loadGameData(): Promise<void> {
    // Try weekly mode first using GameStateManager
    try {
      const weeklyData = await GameStateManager.loadWeeklyGameData();
      if (weeklyData.weeklyCase) {
        this.isWeeklyMode = true;
        this.weeklyCase = weeklyData.weeklyCase;
        this.weeklyProgress = weeklyData.weeklyProgress;
        this.chapterStatuses = weeklyData.chapterStatuses;
        this.currentDayNumber = weeklyData.currentDayNumber;
        return;
      }
    } catch (error) {
      console.log('Weekly mode not available, falling back to daily mode');
    }

    // Fall back to daily mode
    try {
      const response = await fetch('/api/game/init');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = (await response.json()) as InitGameResponse;
      this.currentCase = data.currentCase;
      this.progress = data.progress;
      this.isWeeklyMode = false;
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
    if (this.isWeeklyMode) {
      return this.weeklyProgress?.solved === true;
    }
    return this.progress?.solved === true;
  }

  private wasCorrect(): boolean {
    if (this.isWeeklyMode) {
      return this.weeklyProgress?.correct === true;
    }
    return this.progress?.correct === true;
  }

  private async startGame(): Promise<void> {
    if (this.isWeeklyMode) {
      // Route to WeekOverview for weekly mode
      transitionToScene(this, 'WeekOverview');
      return;
    }

    // Daily mode
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
    const scale = getScaleFactor(this);
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

    // Glow color based on status - larger glow on desktop
    const glowColor = alreadyPlayed ? (wasCorrect ? 0x003300 : 0x330000) : 0x330000;
    this.noirBg.fillStyle(glowColor, 0.25);
    this.noirBg.fillCircle(width / 2, height * 0.35, mobile ? 120 : Math.round(280 * scale));

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

    // Subtitle - different for weekly vs daily mode
    const subtitleText = this.isWeeklyMode ? 'THE WEEKLY MURDER MYSTERY' : 'THE DAILY MURDER MYSTERY';
    if (!this.subtitle) {
      this.subtitle = createNoirText(this, width / 2, height * (mobile ? 0.22 : 0.24), subtitleText, {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      this.subtitle.setText(subtitleText);
      this.subtitle.setPosition(width / 2, height * (mobile ? 0.22 : 0.24));
    }

    // Decorative line
    this.noirBg.lineStyle(2, 0xff4444, 0.4);
    this.noirBg.lineBetween(width * 0.25, height * 0.29, width * 0.75, height * 0.29);

    // Case title - different format for weekly vs daily mode
    let caseTitleText: string;
    if (this.isWeeklyMode && this.weeklyCase) {
      const weekNum = this.weeklyCase.weekNumber;
      const caseTitle = this.weeklyCase.title;
      caseTitleText = `WEEK ${weekNum} CASE:\n${caseTitle.toUpperCase()}`;
    } else {
      const caseNum = this.currentCase?.dayNumber ?? 1;
      const caseTitle = this.currentCase?.title ?? "THE MODERATOR'S LAST BAN";
      caseTitleText = `CASE #${String(caseNum).padStart(3, '0')}:\n${caseTitle.toUpperCase()}`;
    }

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

    // Instructions - different for weekly vs daily mode
    let instructionText: string;
    if (this.isWeeklyMode) {
      const dayInfo = this.currentDayNumber <= 6 ? `DAY ${this.currentDayNumber} OF 7` : 'ACCUSATION DAY';
      instructionText = mobile
        ? `${dayInfo} - NEW CHAPTER DAILY`
        : `${dayInfo} - A NEW CHAPTER UNLOCKS EACH DAY`;
    } else {
      instructionText = mobile
        ? 'TAP CLUES - INTERROGATE - SOLVE'
        : 'EXAMINE CLUES - INTERROGATE SUSPECTS - SOLVE THE CASE';
    }
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

    const scale = getScaleFactor(this);
    const badgeWidth = mobile ? width - 30 : Math.round(450 * scale);
    const badgeHeight = mobile ? 90 : Math.round(140 * scale);
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
    const instructionText = this.isWeeklyMode
      ? 'COME BACK NEXT WEEK FOR A NEW CASE!'
      : 'COME BACK TOMORROW FOR A NEW CASE!';
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
    if (this.isWeeklyMode) {
      if (!this.weeklyCase || !this.weeklyProgress) return;

      const guiltySuspect = this.weeklyCase.suspects.find(s => s.id === this.weeklyCase?.guiltySubjectId);
      const accusedSuspect = this.weeklyCase.suspects.find(s => s.id === this.weeklyProgress?.accusedSuspect);

      const linkedClues = this.weeklyCase.allClues.filter(c => c.linkedTo === guiltySuspect?.id);
      const evidence = linkedClues.map(c => c.name);

      transitionToScene(this, 'GameOver', {
        correct: this.weeklyProgress.correct,
        accusedName: accusedSuspect?.name ?? 'Unknown',
        guiltyName: guiltySuspect?.name ?? 'Unknown',
        evidence: evidence,
        isWeeklyMode: true,
        weeklyCase: this.weeklyCase,
        weeklyProgress: this.weeklyProgress,
      });
      return;
    }

    // Daily mode
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
