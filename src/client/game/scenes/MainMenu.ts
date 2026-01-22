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
    this.scale.on('resize', () => this.refreshLayout());
  }

  private refreshLayout(): void {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);

    // Dark noir background with scanline effect
    if (!this.noirBg) {
      this.noirBg = this.add.graphics();
    }
    this.noirBg.clear();
    this.noirBg.fillStyle(0x0a0a14, 1);
    this.noirBg.fillRect(0, 0, width, height);

    // Scanlines for retro effect
    this.noirBg.lineStyle(1, 0x000000, 0.15);
    for (let y = 0; y < height; y += 4) {
      this.noirBg.lineBetween(0, y, width, y);
    }

    // Add some atmosphere - dim red glow in center
    this.noirBg.fillStyle(0x330000, 0.3);
    this.noirBg.fillCircle(width / 2, height * 0.4, 200);

    const scaleFactor = Math.min(width / 1024, height / 768, 1);

    // Title
    if (!this.title) {
      this.title = this.add
        .text(0, 0, 'REDDIT NOIR', {
          fontFamily: 'Courier New',
          fontSize: '48px',
          color: '#ff4444',
          stroke: '#000000',
          strokeThickness: 6,
        })
        .setOrigin(0.5);
    }
    this.title.setPosition(width / 2, height * 0.22);
    this.title.setScale(scaleFactor);

    // Subtitle
    if (!this.subtitle) {
      this.subtitle = this.add
        .text(0, 0, 'The Daily Murder Mystery', {
          fontFamily: 'Courier New',
          fontSize: '18px',
          color: '#888888',
        })
        .setOrigin(0.5);
    }
    this.subtitle.setPosition(width / 2, height * 0.30);
    this.subtitle.setScale(scaleFactor);

    // Decorative line
    this.noirBg.lineStyle(2, 0xff4444, 0.5);
    this.noirBg.lineBetween(width * 0.3, height * 0.36, width * 0.7, height * 0.36);

    // Case title
    if (!this.caseTitle) {
      this.caseTitle = this.add
        .text(0, 0, "CASE #001:\nThe Moderator's Last Ban", {
          fontFamily: 'Courier New',
          fontSize: '16px',
          color: '#ffd700',
          align: 'center',
          lineSpacing: 5,
        })
        .setOrigin(0.5);
    }
    this.caseTitle.setPosition(width / 2, height * 0.44);
    this.caseTitle.setScale(scaleFactor);

    // Start button
    if (!this.startButton) {
      this.startButton = this.add
        .text(0, 0, '[ START INVESTIGATION ]', {
          fontFamily: 'Courier New',
          fontSize: '22px',
          color: '#00ff00',
          backgroundColor: '#1a1a2e',
          padding: { x: 25, y: 12 },
        })
        .setOrigin(0.5)
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
    this.startButton.setPosition(width / 2, height * 0.58);
    this.startButton.setScale(scaleFactor);

    // Instructions
    if (!this.instructions) {
      this.instructions = this.add
        .text(
          0,
          0,
          'Examine the crime scene for clues\nInterrogate the suspects\nMake your accusation',
          {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#555555',
            align: 'center',
            lineSpacing: 6,
          }
        )
        .setOrigin(0.5);
    }
    this.instructions.setPosition(width / 2, height * 0.74);
    this.instructions.setScale(scaleFactor);

    // Footer
    if (!this.footer) {
      this.footer = this.add
        .text(0, 0, 'A Reddit Devvit Game', {
          fontFamily: 'Courier New',
          fontSize: '10px',
          color: '#333333',
        })
        .setOrigin(0.5);
    }
    this.footer.setPosition(width / 2, height - 15);
  }
}
