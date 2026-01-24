import Phaser, { Scene, GameObjects } from 'phaser';

interface LoadingData {
  targetScene: string;
  targetData?: unknown;
  message?: string;
}

export class Loading extends Scene {
  private loadingText: GameObjects.Text | null = null;
  private progressBar: GameObjects.Graphics | null = null;
  private progressBox: GameObjects.Graphics | null = null;
  private dots: string = '';
  private dotTimer: Phaser.Time.TimerEvent | null = null;
  private targetScene: string = 'MainMenu';
  private targetData: unknown = undefined;
  private message: string = 'Loading';

  constructor() {
    super('Loading');
  }

  private getFontSize(base: number): number {
    const { width } = this.scale;
    const scale = Math.min(width / 320, 1.5);
    return Math.max(Math.floor(base * scale), Math.floor(base * 0.7), 10);
  }

  private isMobile(): boolean {
    return this.scale.width < 500;
  }

  init(data: LoadingData) {
    this.targetScene = data.targetScene || 'MainMenu';
    this.targetData = data.targetData;
    this.message = data.message || 'Loading';
    this.dots = '';
  }

  create() {
    const { width, height } = this.scale;
    const mobile = this.isMobile();

    // Dark noir background
    this.cameras.main.setBackgroundColor(0x0a0a14);

    // Create scanlines
    this.createScanlines(width, height);

    // Subtle glow effect
    const glow = this.add.graphics();
    glow.fillStyle(0x330000, 0.15);
    glow.fillCircle(width / 2, height / 2, mobile ? 100 : 150);

    // Progress box (outline)
    const barWidth = mobile ? width - 60 : 300;
    const barHeight = mobile ? 20 : 24;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2;

    this.progressBox = this.add.graphics();
    this.progressBox.lineStyle(2, 0xff4444, 0.8);
    this.progressBox.strokeRect(barX, barY, barWidth, barHeight);

    // Progress bar fill
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, barY - 30, this.message, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(14)}px`,
      color: '#ff4444',
      resolution: 2,
    }).setOrigin(0.5);

    // Animated dots
    this.dotTimer = this.time.addEvent({
      delay: 400,
      callback: () => {
        this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
        if (this.loadingText) {
          this.loadingText.setText(this.message + this.dots);
        }
      },
      loop: true,
    });

    // Animate progress bar
    this.animateProgress(barX, barY, barWidth, barHeight);
  }

  private createScanlines(width: number, height: number): void {
    const graphics = this.add.graphics();
    const spacing = this.isMobile() ? 5 : 3;
    graphics.lineStyle(1, 0x000000, 0.15);
    for (let y = 0; y < height; y += spacing) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  private animateProgress(barX: number, barY: number, barWidth: number, barHeight: number): void {
    let progress = 0;
    const fillPadding = 3;

    const updateBar = () => {
      if (!this.progressBar) return;

      this.progressBar.clear();
      this.progressBar.fillStyle(0xff4444, 0.9);
      this.progressBar.fillRect(
        barX + fillPadding,
        barY + fillPadding,
        (barWidth - fillPadding * 2) * progress,
        barHeight - fillPadding * 2
      );
    };

    // Animate to ~70% quickly, then slow down to simulate loading
    this.tweens.add({
      targets: { value: 0 },
      value: 0.7,
      duration: 400,
      ease: 'Power2',
      onUpdate: (tween) => {
        progress = tween.getValue();
        updateBar();
      },
      onComplete: () => {
        // Slow progress to 95%
        this.tweens.add({
          targets: { value: 0.7 },
          value: 0.95,
          duration: 300,
          ease: 'Linear',
          onUpdate: (tween) => {
            progress = tween.getValue();
            updateBar();
          },
          onComplete: () => {
            // Complete to 100% and transition
            this.tweens.add({
              targets: { value: 0.95 },
              value: 1,
              duration: 150,
              ease: 'Linear',
              onUpdate: (tween) => {
                progress = tween.getValue();
                updateBar();
              },
              onComplete: () => {
                this.transitionToTarget();
              },
            });
          },
        });
      },
    });
  }

  private transitionToTarget(): void {
    // Clean up timer
    if (this.dotTimer) {
      this.dotTimer.destroy();
    }

    // Fade out then start target scene
    this.cameras.main.fadeOut(200, 10, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.targetScene, this.targetData);
    });
  }

  shutdown() {
    if (this.dotTimer) {
      this.dotTimer.destroy();
      this.dotTimer = null;
    }
  }
}
