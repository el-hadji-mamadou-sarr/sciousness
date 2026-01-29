import { Scene, GameObjects } from 'phaser';
import {
  DetectiveProfile,
  ACHIEVEMENTS,
  AchievementId,
  getDetectiveRank,
} from '../../../shared/types/game';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';
import { drawAchievementBadge, AchievementRarity } from '../utils/ProceduralGraphics';

// Rarity colors for achievements
const RARITY_COLORS: Record<string, number> = {
  common: 0x9ca3af,    // Gray
  rare: 0x3b82f6,      // Blue
  epic: 0xa855f7,      // Purple
  legendary: 0xf59e0b, // Gold
};

const RARITY_TEXT_COLORS: Record<string, 'gray' | 'cyan' | 'gold' | 'white'> = {
  common: 'gray',
  rare: 'cyan',
  epic: 'gold',
  legendary: 'gold',
};

interface ProfileResponse {
  type: string;
  profile: DetectiveProfile;
}

export class Profile extends Scene {
  private profile: DetectiveProfile | null = null;
  private scrollContainer: GameObjects.Container | null = null;
  private scrollY: number = 0;
  private maxScroll: number = 0;

  constructor() {
    super('Profile');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  async create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createBackground(width, height);

    // Show loading while fetching profile
    const loadingText = createNoirText(this, width / 2, height / 2, 'LOADING PROFILE...', {
      size: 'medium',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    await this.loadProfile();

    loadingText.destroy();

    if (this.profile) {
      if (this.isMobile()) {
        this.createMobileLayout(width, height);
      } else {
        this.createDesktopLayout(width, height);
      }
    } else {
      this.createErrorState(width, height);
    }

    this.createBackButton(width, height);
    this.scale.on('resize', () => this.scene.restart());
  }

  private createBackground(width: number, height: number): void {
    const graphics = this.add.graphics();

    // Scanlines
    const spacing = this.isMobile() ? 5 : 3;
    graphics.lineStyle(1, 0x000000, 0.15);
    for (let y = 0; y < height; y += spacing) {
      graphics.lineBetween(0, y, width, y);
    }

    // Ambient glow
    const glow = this.add.graphics();
    glow.fillStyle(0x6c5ce7, 0.03);
    glow.fillCircle(width * 0.3, height * 0.2, 250);
    glow.fillCircle(width * 0.7, height * 0.7, 200);

    // Corner decorations
    this.createCornerDecoration(20, 20);
    this.createCornerDecoration(width - 20, 20, true);
    this.createCornerDecoration(20, height - 20, false, true);
    this.createCornerDecoration(width - 20, height - 20, true, true);
  }

  private createCornerDecoration(x: number, y: number, flipX = false, flipY = false): void {
    const g = this.add.graphics();
    const color = 0x6c5ce7;
    const size = 30;
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;

    g.lineStyle(2, color, 0.4);
    g.beginPath();
    g.moveTo(x, y + sy * size);
    g.lineTo(x, y);
    g.lineTo(x + sx * size, y);
    g.strokePath();

    g.lineStyle(1, color, 0.2);
    g.beginPath();
    g.moveTo(x, y + sy * (size - 10));
    g.lineTo(x + sx * (size - 10), y);
    g.strokePath();
  }

  private async loadProfile(): Promise<void> {
    try {
      const response = await fetch('/api/game/profile');
      if (response.ok) {
        const data = (await response.json()) as ProfileResponse;
        this.profile = data.profile;
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  private createErrorState(width: number, height: number): void {
    createNoirText(this, width / 2, height / 2 - 20, 'FAILED TO LOAD PROFILE', {
      size: 'large',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirText(this, width / 2, height / 2 + 20, 'PLEASE TRY AGAIN LATER', {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });
  }

  private createMobileLayout(width: number, height: number): void {
    const profile = this.profile!;
    const rank = getDetectiveRank(profile.solvedCases.length);

    // Header section
    createNoirText(this, width / 2, 30, 'DETECTIVE PROFILE', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    // Username and rank
    const username = profile.username || 'ANONYMOUS';
    createNoirText(this, width / 2, 65, username.toUpperCase(), {
      size: 'xlarge',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirText(this, width / 2, 95, `${rank.toUpperCase()} DETECTIVE`, {
      size: 'medium',
      color: 'cyan',
      origin: { x: 0.5, y: 0.5 },
    });

    // Stats panel
    this.createStatsPanel(width / 2, 145, width - 30, 100, true);

    // Achievements section (scrollable)
    this.createAchievementsSection(width / 2, 270, width - 30, height - 340, true);
  }

  private createDesktopLayout(width: number, height: number): void {
    const profile = this.profile!;
    const rank = getDetectiveRank(profile.solvedCases.length);

    // Left side - Profile info
    const leftX = width * 0.25;

    createNoirText(this, leftX, 50, 'DETECTIVE PROFILE', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    // Profile badge
    this.createProfileBadge(leftX, 140, rank);

    // Username
    const username = profile.username || 'ANONYMOUS';
    createNoirText(this, leftX, 220, username.toUpperCase(), {
      size: 'xlarge',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirText(this, leftX, 255, `${rank.toUpperCase()} DETECTIVE`, {
      size: 'medium',
      color: 'cyan',
      origin: { x: 0.5, y: 0.5 },
    });

    // Stats panel
    this.createStatsPanel(leftX, 310, 350, 180, false);

    // Right side - Achievements
    const rightX = width * 0.68;
    createNoirText(this, rightX, 50, 'ACHIEVEMENTS', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x6c5ce7, 0.3);
    divider.lineBetween(width / 2 - 20, 80, width / 2 - 20, height - 80);

    // Achievements section
    this.createAchievementsSection(rightX, 80, width * 0.55, height - 160, false);
  }

  private createProfileBadge(x: number, y: number, rank: string): void {
    const badge = this.add.graphics();
    const size = 50;

    // Outer glow
    badge.fillStyle(0x6c5ce7, 0.1);
    badge.fillCircle(x, y, size + 15);

    // Main circle
    badge.lineStyle(4, 0x6c5ce7, 1);
    badge.strokeCircle(x, y, size);

    // Inner ring
    badge.lineStyle(1, 0x6c5ce7, 0.4);
    badge.strokeCircle(x, y, size - 8);

    // Rank initial
    const initial = rank.charAt(0);
    createNoirText(this, x, y, initial, {
      size: 'xlarge',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });
  }

  private createStatsPanel(x: number, y: number, panelWidth: number, panelHeight: number, mobile: boolean): void {
    const profile = this.profile!;
    const container = this.add.container(x, y);

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 10);
    bg.lineStyle(2, 0x6c5ce7, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 10);
    container.add(bg);

    const stats = [
      { label: 'TOTAL POINTS', value: profile.points.toString(), color: 'gold' as const },
      { label: 'CASES SOLVED', value: profile.solvedCases.length.toString(), color: 'green' as const },
      { label: 'CURRENT STREAK', value: `${profile.currentStreak || 0} DAYS`, color: 'cyan' as const },
      { label: 'BEST STREAK', value: `${profile.longestStreak || 0} DAYS`, color: 'white' as const },
    ];

    if (mobile) {
      // 2x2 grid for mobile
      const colWidth = panelWidth / 2;
      const rowHeight = panelHeight / 2;

      stats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const statX = -panelWidth / 2 + colWidth * col + colWidth / 2;
        const statY = rowHeight * row + rowHeight / 2;

        container.add(createNoirText(this, statX, statY - 12, stat.value, {
          size: 'large',
          color: stat.color,
          origin: { x: 0.5, y: 0.5 },
        }));

        container.add(createNoirText(this, statX, statY + 12, stat.label, {
          size: 'small',
          color: 'gray',
          origin: { x: 0.5, y: 0.5 },
          scale: 0.8,
        }));
      });
    } else {
      // 2x2 grid for desktop as well (to prevent text overlap)
      const colWidth = panelWidth / 2;
      const rowHeight = (panelHeight - 30) / 2; // Leave space for accuracy at bottom

      stats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const statX = -panelWidth / 2 + colWidth * col + colWidth / 2;
        const statY = rowHeight * row + rowHeight / 2 + 5;

        container.add(createNoirText(this, statX, statY - 15, stat.value, {
          size: 'large',
          color: stat.color,
          origin: { x: 0.5, y: 0.5 },
        }));

        container.add(createNoirText(this, statX, statY + 15, stat.label, {
          size: 'small',
          color: 'gray',
          origin: { x: 0.5, y: 0.5 },
          scale: 0.8,
        }));
      });
    }

  }

  private createAchievementsSection(x: number, y: number, sectionWidth: number, sectionHeight: number, mobile: boolean): void {
    const profile = this.profile!;
    const allAchievements = Object.values(ACHIEVEMENTS);
    const unlockedIds = profile.achievements || [];

    // Container for the section
    const sectionContainer = this.add.container(x, y);

    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(0x12121f, 0.9);
    bg.fillRoundedRect(-sectionWidth / 2, 0, sectionWidth, sectionHeight, 10);
    bg.lineStyle(1, 0x6c5ce7, 0.3);
    bg.strokeRoundedRect(-sectionWidth / 2, 0, sectionWidth, sectionHeight, 10);
    sectionContainer.add(bg);

    // Achievement count
    const countText = `${unlockedIds.length}/${allAchievements.length} UNLOCKED`;
    sectionContainer.add(createNoirText(this, 0, 15, countText, {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0 },
    }));

    // Scrollable content
    this.scrollContainer = this.add.container(0, 40);
    sectionContainer.add(this.scrollContainer);

    // Create achievement cards
    const cardHeight = mobile ? 70 : 60;
    const cardWidth = sectionWidth - 20;
    const padding = 8;
    let yOffset = 0;

    // Sort achievements: unlocked first, then by rarity
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const sortedAchievements = [...allAchievements].sort((a, b) => {
      const aUnlocked = unlockedIds.includes(a.id);
      const bUnlocked = unlockedIds.includes(b.id);
      if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    for (const achievement of sortedAchievements) {
      const isUnlocked = unlockedIds.includes(achievement.id);
      this.createAchievementCard(
        this.scrollContainer,
        0,
        yOffset,
        cardWidth,
        cardHeight,
        achievement,
        isUnlocked,
        mobile
      );
      yOffset += cardHeight + padding;
    }

    // Calculate max scroll
    const contentHeight = yOffset;
    const viewHeight = sectionHeight - 50;
    this.maxScroll = Math.max(0, contentHeight - viewHeight);

    // Create mask for scrolling
    const maskX = x - sectionWidth / 2;
    const maskY = y + 35;
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(maskX, maskY, sectionWidth, viewHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // Make section interactive for scrolling
    if (this.maxScroll > 0) {
      const hitArea = new Phaser.Geom.Rectangle(-sectionWidth / 2, 0, sectionWidth, sectionHeight);
      sectionContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      let isDragging = false;
      let lastY = 0;

      sectionContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        isDragging = true;
        lastY = pointer.y;
      });

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!isDragging || !this.scrollContainer) return;
        const deltaY = lastY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScroll);
        this.scrollContainer.y = 40 - this.scrollY;
        lastY = pointer.y;
      });

      this.input.on('pointerup', () => {
        isDragging = false;
      });

      sectionContainer.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, dy: number) => {
        if (!this.scrollContainer) return;
        this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScroll);
        this.scrollContainer.y = 40 - this.scrollY;
      });

      // Scroll indicator
      const scrollIndicator = this.add.graphics();
      const updateScrollIndicator = () => {
        scrollIndicator.clear();
        if (this.maxScroll <= 0) return;
        const scrollRatio = this.scrollY / this.maxScroll;
        const indicatorHeight = Math.max(20, (viewHeight / contentHeight) * viewHeight);
        const indicatorY = scrollRatio * (viewHeight - indicatorHeight);
        scrollIndicator.fillStyle(0x6c5ce7, 0.5);
        scrollIndicator.fillRoundedRect(sectionWidth / 2 - 8, indicatorY + 40, 4, indicatorHeight, 2);
      };
      updateScrollIndicator();
      sectionContainer.add(scrollIndicator);

      // Update scroll indicator on scroll
      this.input.on('pointermove', () => updateScrollIndicator());
      sectionContainer.on('wheel', () => updateScrollIndicator());
    }
  }

  private createAchievementCard(
    container: GameObjects.Container,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number,
    achievement: typeof ACHIEVEMENTS[AchievementId],
    isUnlocked: boolean,
    mobile: boolean
  ): void {
    const cardContainer = this.add.container(x, y);
    container.add(cardContainer);

    const rarityColor = RARITY_COLORS[achievement.rarity];

    // Card background
    const cardBg = this.add.graphics();
    cardBg.fillStyle(isUnlocked ? 0x1a1a2e : 0x101018, 0.95);
    cardBg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 8);
    cardBg.lineStyle(2, rarityColor, isUnlocked ? 0.8 : 0.3);
    cardBg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 8);
    cardContainer.add(cardBg);

    // Procedural achievement badge icon
    const iconX = -cardWidth / 2 + (mobile ? 35 : 40);
    const iconY = cardHeight / 2;
    const iconSize = mobile ? 44 : 50;

    const badgeGraphics = this.add.graphics();
    drawAchievementBadge(
      badgeGraphics,
      iconX,
      iconY,
      iconSize,
      achievement.id,
      achievement.rarity as AchievementRarity,
      isUnlocked
    );
    cardContainer.add(badgeGraphics);

    // Achievement name
    const textX = iconX + iconSize / 2 + 15;
    const textColor = isUnlocked ? RARITY_TEXT_COLORS[achievement.rarity] : 'gray';
    cardContainer.add(createNoirText(this, textX, mobile ? 18 : 15, achievement.name.toUpperCase(), {
      size: mobile ? 'small' : 'medium',
      color: isUnlocked ? textColor : 'gray',
      origin: { x: 0, y: 0 },
    }));

    // Description
    const descText = isUnlocked ? achievement.description : '???';
    cardContainer.add(createNoirText(this, textX, mobile ? 40 : 38, descText.toUpperCase(), {
      size: 'small',
      color: 'gray',
      origin: { x: 0, y: 0 },
      scale: 0.8,
      maxWidth: cardWidth - iconSize - 60,
    }));

    // Rarity badge text
    if (isUnlocked) {
      const badgeX = cardWidth / 2 - 10;
      const badgeY = 10;
      cardContainer.add(createNoirText(this, badgeX, badgeY, achievement.rarity.toUpperCase(), {
        size: 'small',
        color: textColor,
        origin: { x: 1, y: 0 },
        scale: 0.6,
      }));
    }

    // The lock icon is now drawn procedurally inside drawAchievementBadge
  }

  private createBackButton(width: number, height: number): void {
    const mobile = this.isMobile();
    const btnY = height - (mobile ? 35 : 40);

    createNoirButton(this, width / 2, btnY, '[ BACK TO MENU ]', {
      size: 'medium',
      color: 'white',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'MainMenu'),
      padding: { x: 25, y: 12 },
    });
  }
}
