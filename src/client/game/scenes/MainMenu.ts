import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
  private noirBg: GameObjects.Graphics | null = null;
  private title: GameObjects.Text | null = null;
  private subtitle: GameObjects.Text | null = null;
  private caseTitle: GameObjects.Text | null = null;
  private startButton: GameObjects.Text | null = null;
  private instructions: GameObjects.Text | null = null;
  private footer: GameObjects.Text | null = null;

  constructor() {
    super('MainMenu');
  }

  private getFontSize(base: number): number {
    const { width } = this.scale;
    // Use 320px as reference for mobile, scale up from there
    const scale = Math.min(width / 320, 1.5);
    // Ensure minimum readable size (at least 70% of base, minimum 10px)
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
    this.instructions = null;
    this.footer = null;
  }

  create() {
    this.refreshLayout();
    this.scale.on('resize', () => this.scene.restart());
  }

  private refreshLayout(): void {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    this.cameras.resize(width, height);

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

    // Red glow
    this.noirBg.fillStyle(0x330000, 0.25);
    this.noirBg.fillCircle(width / 2, height * 0.35, mobile ? 120 : 180);

    // Title
    if (!this.title) {
      this.title = this.add.text(0, 0, 'REDDIT NOIR', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(32)}px`,
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5);
    }
    this.title.setPosition(width / 2, height * (mobile ? 0.18 : 0.2));
    this.title.setFontSize(this.getFontSize(32));

    // Subtitle
    if (!this.subtitle) {
      this.subtitle = this.add.text(0, 0, 'The Daily Murder Mystery', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(12)}px`,
        color: '#888888',
      }).setOrigin(0.5);
    }
    this.subtitle.setPosition(width / 2, height * (mobile ? 0.26 : 0.28));
    this.subtitle.setFontSize(this.getFontSize(12));

    // Decorative line
    this.noirBg.lineStyle(2, 0xff4444, 0.4);
    this.noirBg.lineBetween(width * 0.25, height * 0.33, width * 0.75, height * 0.33);

    // Case title
    if (!this.caseTitle) {
      this.caseTitle = this.add.text(0, 0, "CASE #001:\nThe Moderator's Last Ban", {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(12)}px`,
        color: '#ffd700',
        align: 'center',
        lineSpacing: 4,
      }).setOrigin(0.5);
    }
    this.caseTitle.setPosition(width / 2, height * (mobile ? 0.42 : 0.42));
    this.caseTitle.setFontSize(this.getFontSize(11));

    // Start button
    if (!this.startButton) {
      this.startButton = this.add.text(0, 0, '[START]', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(18)}px`,
        color: '#00ff00',
        backgroundColor: '#1a1a2e',
        padding: { x: 20, y: 10 },
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
          this.scene.start('CrimeScene');
        });
    }
    this.startButton.setPosition(width / 2, height * (mobile ? 0.56 : 0.56));
    this.startButton.setFontSize(this.getFontSize(18));

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
      }).setOrigin(0.5);
    } else {
      this.instructions.setText(instructionText);
    }
    this.instructions.setPosition(width / 2, height * (mobile ? 0.72 : 0.72));
    this.instructions.setFontSize(this.getFontSize(9));

    // Footer
    if (!this.footer) {
      this.footer = this.add.text(0, 0, 'A Reddit Devvit Game', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(8)}px`,
        color: '#333333',
      }).setOrigin(0.5);
    }
    this.footer.setPosition(width / 2, height - 12);
    this.footer.setFontSize(this.getFontSize(8));
  }
}
