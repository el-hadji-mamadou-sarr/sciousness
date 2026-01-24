import Phaser, { Scene, GameObjects } from 'phaser';
import { loadBitmapFonts } from '../utils/BitmapFontLoader';

export class Preloader extends Scene {
  private loadingText: GameObjects.Text | null = null;
  private progressBar: GameObjects.Graphics | null = null;
  private progressBox: GameObjects.Graphics | null = null;
  private percentText: GameObjects.Text | null = null;
  private dots: string = '';
  private dotTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('Preloader');
  }

  private getFontSize(base: number): number {
    const { width } = this.scale;
    const scale = Math.min(width / 320, 1.5);
    return Math.max(Math.floor(base * scale), Math.floor(base * 0.7), 10);
  }

  private isMobile(): boolean {
    return this.scale.width < 500;
  }

  init() {
    const { width, height } = this.scale;
    const mobile = this.isMobile();

    // Dark noir background
    this.cameras.main.setBackgroundColor(0x0a0a14);

    // Create scanlines effect
    this.createScanlines(width, height);

    // Subtle red glow
    const glow = this.add.graphics();
    glow.fillStyle(0x330000, 0.2);
    glow.fillCircle(width / 2, height / 2 - 40, mobile ? 120 : 180);

    // Title
    this.add.text(width / 2, height / 2 - (mobile ? 80 : 100), 'REDDIT NOIR', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(28)}px`,
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 - (mobile ? 50 : 65), 'The Daily Murder Mystery', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(10)}px`,
      color: '#666666',
      resolution: 2,
    }).setOrigin(0.5);

    // Progress bar dimensions
    const barWidth = mobile ? width - 60 : 350;
    const barHeight = mobile ? 22 : 28;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + (mobile ? 20 : 30);

    // Progress box (outline)
    this.progressBox = this.add.graphics();
    this.progressBox.lineStyle(2, 0xff4444, 0.8);
    this.progressBox.strokeRect(barX, barY, barWidth, barHeight);
    this.progressBox.lineStyle(1, 0xff4444, 0.2);
    this.progressBox.strokeRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

    // Progress bar fill
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, barY + barHeight + 25, 'Gathering evidence', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(11)}px`,
      color: '#888888',
      resolution: 2,
    }).setOrigin(0.5);

    // Percentage text
    this.percentText = this.add.text(width / 2, barY + barHeight / 2, '0%', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(12)}px`,
      color: '#ffffff',
      resolution: 2,
    }).setOrigin(0.5);

    // Animated dots
    this.dotTimer = this.time.addEvent({
      delay: 400,
      callback: () => {
        this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
        if (this.loadingText) {
          this.loadingText.setText('Gathering evidence' + this.dots);
        }
      },
      loop: true,
    });

    // Progress bar update
    const fillPadding = 4;
    this.load.on('progress', (progress: number) => {
      if (!this.progressBar || !this.percentText) return;

      this.progressBar.clear();
      this.progressBar.fillStyle(0xff4444, 0.9);
      this.progressBar.fillRect(
        barX + fillPadding,
        barY + fillPadding,
        (barWidth - fillPadding * 2) * progress,
        barHeight - fillPadding * 2
      );

      this.percentText.setText(`${Math.floor(progress * 100)}%`);
    });
  }

  private createScanlines(width: number, height: number): void {
    const graphics = this.add.graphics();
    const spacing = this.isMobile() ? 5 : 3;
    graphics.lineStyle(1, 0x000000, 0.15);
    for (let y = 0; y < height; y += spacing) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  preload() {
    //  Load the assets for the game
    this.load.setPath('../assets');
    this.load.image('logo', 'logo.png');
  }

  create() {
    // Clean up timer
    if (this.dotTimer) {
      this.dotTimer.destroy();
    }

    // Load bitmap fonts for crisp text rendering
    loadBitmapFonts(this);

    // Brief delay to show completion, then fade to MainMenu
    this.time.delayedCall(300, () => {
      this.cameras.main.fadeOut(300, 10, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    });
  }
}
