import { Scene, GameObjects } from 'phaser';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen, getScaleFactor } from '../utils/NoirText';
import { AudioManager } from '../utils/AudioManager';
import { GameStateManager, GameMode } from '../utils/GameStateManager';

export class ModeSelect extends Scene {
  private noirBg: GameObjects.Graphics | null = null;
  private title: GameObjects.Text | null = null;
  private subtitle: GameObjects.Text | null = null;
  private profileButton: GameObjects.Container | null = null;
  private footer: GameObjects.Text | null = null;

  // Mode availability
  private isDailyAvailable: boolean = false;
  private isWeeklyAvailable: boolean = false;

  constructor() {
    super('ModeSelect');
  }

  init(): void {
    this.noirBg = null;
    this.title = null;
    this.subtitle = null;
    this.profileButton = null;
    this.footer = null;
    this.isDailyAvailable = false;
    this.isWeeklyAvailable = false;
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  async create() {
    await this.checkModeAvailability();
    this.refreshLayout();
    this.scale.on('resize', () => this.scene.restart());

    // Start background music
    AudioManager.playMusic(this, 'bgmusic');
  }

  private async checkModeAvailability(): Promise<void> {
    // Check daily mode availability
    try {
      const response = await fetch('/api/game/init');
      if (response.ok) {
        this.isDailyAvailable = true;
      }
    } catch {
      this.isDailyAvailable = false;
    }

    // Check weekly mode availability
    try {
      const weeklyData = await GameStateManager.loadWeeklyGameData();
      this.isWeeklyAvailable = weeklyData.weeklyCase !== null;
    } catch {
      this.isWeeklyAvailable = false;
    }
  }

  private selectMode(mode: GameMode): void {
    // Pass the selected mode to MainMenu
    transitionToScene(this, 'MainMenu', { gameMode: mode });
  }

  private goToProfile(): void {
    transitionToScene(this, 'Profile');
  }

  private refreshLayout(): void {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
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

    // Red glow in center
    this.noirBg.fillStyle(0x330000, 0.25);
    this.noirBg.fillCircle(width / 2, height * 0.35, mobile ? 120 : Math.round(280 * scale));

    // Title
    if (!this.title) {
      this.title = createNoirText(this, width / 2, height * (mobile ? 0.10 : 0.12), 'REDDIT NOIR', {
        size: 'xlarge',
        color: 'red',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      this.title.setPosition(width / 2, height * (mobile ? 0.10 : 0.12));
    }

    // Subtitle
    if (!this.subtitle) {
      this.subtitle = createNoirText(this, width / 2, height * (mobile ? 0.18 : 0.20), 'SELECT YOUR CASE TYPE', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      this.subtitle.setPosition(width / 2, height * (mobile ? 0.18 : 0.20));
    }

    // Decorative line
    this.noirBg.lineStyle(2, 0xff4444, 0.4);
    this.noirBg.lineBetween(width * 0.25, height * 0.25, width * 0.75, height * 0.25);

    // Create mode selection cards
    this.createModeCards(width, height, mobile, scale);

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

  private createModeCards(width: number, height: number, mobile: boolean, scale: number): void {
    const cardWidth = mobile ? width - 40 : Math.round(320 * scale);
    const cardHeight = mobile ? 140 : Math.round(200 * scale);
    const cardSpacing = mobile ? 20 : Math.round(40 * scale);

    // Calculate positions - stack vertically on mobile, side by side on desktop
    const dailyX = mobile ? width / 2 : width / 2 - cardWidth / 2 - cardSpacing / 2;
    const weeklyX = mobile ? width / 2 : width / 2 + cardWidth / 2 + cardSpacing / 2;
    const dailyY = mobile ? height * 0.38 : height * 0.48;
    const weeklyY = mobile ? height * 0.62 : height * 0.48;

    // Daily Mode Card
    this.createModeCard(
      dailyX,
      dailyY,
      cardWidth,
      cardHeight,
      'DAILY CASE',
      'A new mystery every day',
      'Solve today\'s case before midnight',
      'daily',
      this.isDailyAvailable,
      0x003300 // Green tint
    );

    // Weekly Mode Card
    this.createModeCard(
      weeklyX,
      weeklyY,
      cardWidth,
      cardHeight,
      'WEEKLY CASE',
      'A 7-day mystery saga',
      'New chapters unlock each day',
      'weekly',
      this.isWeeklyAvailable,
      0x000033 // Blue tint
    );
  }

  private createModeCard(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    description: string,
    subtext: string,
    mode: GameMode,
    isAvailable: boolean,
    glowColor: number
  ): void {
    const card = this.add.container(x, y);

    // Card background with glow
    const bg = this.add.graphics();

    // Glow effect
    if (isAvailable) {
      bg.fillStyle(glowColor, 0.3);
      bg.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 14);
    }

    // Main card
    bg.fillStyle(isAvailable ? 0x1a1a2e : 0x0a0a14, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);

    // Border
    const borderColor = isAvailable ? (mode === 'daily' ? 0x00ff00 : 0x4444ff) : 0x333333;
    bg.lineStyle(2, borderColor, isAvailable ? 0.8 : 0.3);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

    card.add(bg);

    // Title
    const titleText = createNoirText(this, 0, -height / 2 + 30, title, {
      size: 'large',
      color: isAvailable ? (mode === 'daily' ? 'green' : 'cyan') : 'gray',
      origin: { x: 0.5, y: 0.5 },
    });
    card.add(titleText);

    // Description
    const descText = createNoirText(this, 0, -height / 2 + 70, description, {
      size: 'medium',
      color: isAvailable ? 'white' : 'darkGray',
      origin: { x: 0.5, y: 0.5 },
    });
    card.add(descText);

    // Subtext
    const subText = createNoirText(this, 0, -height / 2 + 100, subtext, {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });
    card.add(subText);

    // Play button or unavailable message
    if (isAvailable) {
      const playButton = createNoirButton(this, 0, height / 2 - 40, '[ PLAY ]', {
        size: 'medium',
        color: mode === 'daily' ? 'green' : 'cyan',
        hoverColor: 'gold',
        onClick: () => this.selectMode(mode),
        padding: { x: 25, y: 12 },
      });
      card.add(playButton);
    } else {
      const unavailableText = createNoirText(this, 0, height / 2 - 40, 'NOT AVAILABLE', {
        size: 'small',
        color: 'darkGray',
        origin: { x: 0.5, y: 0.5 },
      });
      card.add(unavailableText);
    }

    // Make entire card clickable if available
    if (isAvailable) {
      card.setSize(width, height);
      card.setInteractive({ useHandCursor: true });

      card.on('pointerover', () => {
        bg.clear();
        // Enhanced glow
        bg.fillStyle(glowColor, 0.5);
        bg.fillRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, 16);
        // Main card
        bg.fillStyle(0x2a2a4e, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        // Border
        bg.lineStyle(3, borderColor, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
      });

      card.on('pointerout', () => {
        bg.clear();
        // Normal glow
        bg.fillStyle(glowColor, 0.3);
        bg.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 14);
        // Main card
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        // Border
        bg.lineStyle(2, borderColor, 0.8);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
      });

      card.on('pointerdown', () => this.selectMode(mode));
    }
  }
}
