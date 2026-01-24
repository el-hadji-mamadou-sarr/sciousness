import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, InitGameResponse } from '../../../shared/types/game';
import { context } from '@devvit/web/client';

// Admin usernames that can play unlimited times for testing
const ADMIN_USERNAMES = ['ashscars'];

export class MainMenu extends Scene {
  private noirBg: GameObjects.Graphics | null = null;
  private title: GameObjects.Text | null = null;
  private subtitle: GameObjects.Text | null = null;
  private caseTitle: GameObjects.Text | null = null;
  private startButton: GameObjects.Text | null = null;
  private viewResultButton: GameObjects.Text | null = null;
  private instructions: GameObjects.Text | null = null;
  private footer: GameObjects.Text | null = null;
  private statusText: GameObjects.Text | null = null;
  private statusBadge: GameObjects.Graphics | null = null;

  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;

  constructor() {
    super('MainMenu');
  }

  private getFontSize(base: number): number {
    const { width } = this.scale;
    const scale = Math.min(width / 320, 1.5);
    return Math.max(Math.floor(base * scale), Math.floor(base * 0.7), 10);
  }

  private isMobile(): boolean {
    return this.scale.width < 500;
  }

  init(): void {
    this.noirBg = null;
    this.title = null;
    this.subtitle = null;
    this.caseTitle = null;
    this.startButton = null;
    this.viewResultButton = null;
    this.instructions = null;
    this.footer = null;
    this.statusText = null;
    this.statusBadge = null;
  }

  async create() {
    await this.loadGameData();
    this.refreshLayout();
    this.scale.on('resize', () => this.scene.restart());
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
      // Use defaults - allow play
      this.progress = { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
    }
  }

  private isAdmin(): boolean {
    const username = context.username?.toLowerCase();
    return username ? ADMIN_USERNAMES.includes(username) : false;
  }

  private hasAlreadyPlayed(): boolean {
    // Admins can always play for testing purposes
    if (this.isAdmin()) {
      return false;
    }
    return this.progress?.solved === true;
  }

  private wasCorrect(): boolean {
    return this.progress?.correct === true;
  }

  private async startGame(): Promise<void> {
    // If admin has already played, reset their progress first
    if (this.isAdmin() && this.progress?.solved) {
      try {
        await fetch('/api/game/reset', { method: 'POST' });
      } catch (error) {
        console.error('Failed to reset admin progress:', error);
      }
    }
    this.scene.start('CrimeScene');
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
      this.title = this.add.text(0, 0, 'REDDIT NOIR', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(32)}px`,
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 4,
        resolution: 2,
      }).setOrigin(0.5);
    }
    this.title.setPosition(width / 2, height * (mobile ? 0.14 : 0.16));
    this.title.setFontSize(this.getFontSize(32));

    // Subtitle
    if (!this.subtitle) {
      this.subtitle = this.add.text(0, 0, 'The Daily Murder Mystery', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(12)}px`,
        color: '#888888',
        resolution: 2,
      }).setOrigin(0.5);
    }
    this.subtitle.setPosition(width / 2, height * (mobile ? 0.22 : 0.24));
    this.subtitle.setFontSize(this.getFontSize(12));

    // Decorative line
    this.noirBg.lineStyle(2, 0xff4444, 0.4);
    this.noirBg.lineBetween(width * 0.25, height * 0.29, width * 0.75, height * 0.29);

    // Case title
    const caseTitleText = this.currentCase
      ? `CASE #${String(this.currentCase.dayNumber).padStart(3, '0')}:\n${this.currentCase.title}`
      : "CASE #001:\nThe Moderator's Last Ban";
    if (!this.caseTitle) {
      this.caseTitle = this.add.text(0, 0, caseTitleText, {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(12)}px`,
        color: '#ffd700',
        align: 'center',
        lineSpacing: 4,
        resolution: 2,
      }).setOrigin(0.5);
    } else {
      this.caseTitle.setText(caseTitleText);
    }
    this.caseTitle.setPosition(width / 2, height * (mobile ? 0.36 : 0.36));
    this.caseTitle.setFontSize(this.getFontSize(11));

    // Status badge for returning players
    if (alreadyPlayed) {
      this.createAlreadyPlayedUI(width, height, mobile, wasCorrect);
    } else {
      this.createNewPlayerUI(width, height, mobile);
    }

    // Footer
    if (!this.footer) {
      this.footer = this.add.text(0, 0, 'A Reddit Devvit Game', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(8)}px`,
        color: '#333333',
        resolution: 2,
      }).setOrigin(0.5);
    }
    this.footer.setPosition(width / 2, height - 12);
    this.footer.setFontSize(this.getFontSize(8));
  }

  private createNewPlayerUI(width: number, height: number, mobile: boolean): void {
    // Start button
    if (!this.startButton) {
      this.startButton = this.add.text(0, 0, '[START]', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(18)}px`,
        color: '#00ff00',
        backgroundColor: '#1a1a2e',
        padding: { x: 20, y: 10 },
        resolution: 2,
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          this.startButton?.setColor('#00ffff');
          this.startButton?.setStyle({ backgroundColor: '#2a2a4e' });
        })
        .on('pointerout', () => {
          this.startButton?.setColor('#00ff00');
          this.startButton?.setStyle({ backgroundColor: '#1a1a2e' });
        })
        .on('pointerdown', () => {
          this.startGame();
        });
    }
    this.startButton.setPosition(width / 2, height * (mobile ? 0.52 : 0.52));
    this.startButton.setFontSize(this.getFontSize(18));
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
      ? 'Tap clues • Interrogate • Solve'
      : 'Examine clues • Interrogate suspects • Solve the case';
    if (!this.instructions) {
      this.instructions = this.add.text(0, 0, instructionText, {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(9)}px`,
        color: '#555555',
        align: 'center',
        resolution: 2,
      }).setOrigin(0.5);
    } else {
      this.instructions.setText(instructionText);
    }
    this.instructions.setPosition(width / 2, height * (mobile ? 0.68 : 0.68));
    this.instructions.setFontSize(this.getFontSize(9));
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

    // Status text - larger for mobile
    const statusMessage = wasCorrect
      ? '✓ CASE SOLVED\nYou caught the killer!'
      : '✗ CASE FAILED\nThe killer got away...';

    if (!this.statusText) {
      this.statusText = this.add.text(0, 0, statusMessage, {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(16)}px`,
        color: wasCorrect ? '#00ff00' : '#ff4444',
        align: 'center',
        lineSpacing: 8,
        resolution: 2,
      }).setOrigin(0.5);
    } else {
      this.statusText.setText(statusMessage);
      this.statusText.setColor(wasCorrect ? '#00ff00' : '#ff4444');
    }
    this.statusText.setPosition(width / 2, badgeY + badgeHeight / 2);
    this.statusText.setFontSize(this.getFontSize(16));
    this.statusText.setVisible(true);

    // View Result button - larger and more prominent for mobile
    if (!this.viewResultButton) {
      this.viewResultButton = this.add.text(0, 0, '[ VIEW RESULT ]', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(18)}px`,
        color: '#ffd700',
        backgroundColor: '#1a1a2e',
        padding: { x: mobile ? 20 : 18, y: mobile ? 12 : 10 },
        resolution: 2,
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          this.viewResultButton?.setColor('#ffff00');
          this.viewResultButton?.setStyle({ backgroundColor: '#2a2a4e' });
        })
        .on('pointerout', () => {
          this.viewResultButton?.setColor('#ffd700');
          this.viewResultButton?.setStyle({ backgroundColor: '#1a1a2e' });
        })
        .on('pointerdown', () => {
          this.goToResultScreen();
        });
    }
    this.viewResultButton.setPosition(width / 2, height * (mobile ? 0.70 : 0.70));
    this.viewResultButton.setFontSize(this.getFontSize(18));
    this.viewResultButton.setVisible(true);

    // Update instructions for returning players
    const instructionText = 'Come back tomorrow for a new case!';
    if (!this.instructions) {
      this.instructions = this.add.text(0, 0, instructionText, {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(11)}px`,
        color: '#666666',
        align: 'center',
        resolution: 2,
      }).setOrigin(0.5);
    } else {
      this.instructions.setText(instructionText);
    }
    this.instructions.setPosition(width / 2, height * (mobile ? 0.82 : 0.82));
    this.instructions.setFontSize(this.getFontSize(11));
    this.instructions.setVisible(true);
  }

  private goToResultScreen(): void {
    if (!this.currentCase || !this.progress) return;

    const guiltySuspect = this.currentCase.suspects.find(s => s.isGuilty);
    const accusedSuspect = this.currentCase.suspects.find(s => s.id === this.progress?.accusedSuspect);

    // Get evidence linked to guilty suspect
    const linkedClues = this.currentCase.clues.filter(c => c.linkedTo === guiltySuspect?.id);
    const evidence = linkedClues.map(c => c.name);

    this.scene.start('GameOver', {
      correct: this.progress.correct,
      accusedName: accusedSuspect?.name ?? 'Unknown',
      guiltyName: guiltySuspect?.name ?? 'Unknown',
      evidence: evidence,
      currentCase: this.currentCase,
      progress: this.progress,
    });
  }
}
