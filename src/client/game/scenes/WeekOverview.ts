import { Scene, GameObjects } from 'phaser';
import {
  WeeklyCase,
  WeeklyProgress,
  ChapterStatus,
  InitWeeklyGameResponse,
} from '../../../shared/types/game';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen, getScaleFactor } from '../utils/NoirText';

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export class WeekOverview extends Scene {
  private weeklyCase: WeeklyCase | null = null;
  private progress: WeeklyProgress | null = null;
  private chapterStatuses: ChapterStatus[] = [];
  private currentDayNumber: number = 1;
  private isAccusationUnlocked: boolean = false;

  private dayContainers: GameObjects.Container[] = [];

  constructor() {
    super('WeekOverview');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  init(): void {
    this.dayContainers = [];
  }

  async create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createBackground(width, height);

    // Show loading while fetching data
    const loadingText = createNoirText(this, width / 2, height / 2, 'LOADING WEEKLY CASE...', {
      size: 'medium',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    await this.loadWeeklyData();

    loadingText.destroy();

    if (this.weeklyCase) {
      this.createLayout(width, height);
    } else {
      this.createErrorState(width, height);
    }

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
  }

  private async loadWeeklyData(): Promise<void> {
    try {
      const response = await fetch('/api/weekly/init');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = (await response.json()) as InitWeeklyGameResponse;
      this.weeklyCase = data.weeklyCase;
      this.progress = data.progress;
      this.chapterStatuses = data.chapterStatuses;
      this.currentDayNumber = data.currentDayNumber;
      this.isAccusationUnlocked = data.isAccusationUnlocked;
    } catch (error) {
      console.error('Failed to load weekly data:', error);
    }
  }

  private createErrorState(width: number, height: number): void {
    createNoirText(this, width / 2, height / 2 - 20, 'NO WEEKLY CASE AVAILABLE', {
      size: 'large',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirText(this, width / 2, height / 2 + 20, 'CHECK BACK LATER', {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirButton(this, width / 2, height - 60, '[ BACK TO MENU ]', {
      size: 'medium',
      color: 'white',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'MainMenu'),
      padding: { x: 25, y: 12 },
    });
  }

  private createLayout(width: number, height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);

    // Header
    createNoirText(this, width / 2, mobile ? 25 : 35, 'WEEKLY CASE', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    // Case title
    const caseTitle = this.weeklyCase?.title || 'UNKNOWN CASE';
    createNoirText(this, width / 2, mobile ? 55 : 70, caseTitle.toUpperCase(), {
      size: 'medium',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    });

    // Week progress text
    const completedCount = this.progress?.chaptersCompleted.length || 0;
    createNoirText(this, width / 2, mobile ? 80 : 100, `${completedCount}/7 CHAPTERS COMPLETE`, {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    // Create day timeline
    this.createDayTimeline(width, height, mobile, scale);

    // Current chapter info panel
    this.createCurrentChapterPanel(width, height, mobile);

    // Bottom buttons
    this.createBottomButtons(width, height, mobile);
  }

  private createDayTimeline(width: number, height: number, mobile: boolean, scale: number): void {
    const timelineY = mobile ? 140 : 180;
    const daySize = mobile ? 40 : Math.round(60 * scale);
    const daySpacing = mobile ? 6 : Math.round(15 * scale);
    const totalWidth = 7 * daySize + 6 * daySpacing;
    const startX = (width - totalWidth) / 2 + daySize / 2;

    for (let i = 0; i < 7; i++) {
      const dayNumber = i + 1;
      const x = startX + i * (daySize + daySpacing);
      const status = this.chapterStatuses[i];

      const container = this.createDayNode(x, timelineY, daySize, dayNumber, status, mobile);
      this.dayContainers.push(container);

      // Draw connecting line between days
      if (i < 6) {
        const lineGraphics = this.add.graphics();
        const nextStatus = this.chapterStatuses[i + 1];
        const lineColor = status?.isCompleted ? 0x00ff00 : 0x333333;
        lineGraphics.lineStyle(2, lineColor, 0.5);
        lineGraphics.lineBetween(
          x + daySize / 2 + 2,
          timelineY,
          x + daySize + daySpacing - 2,
          timelineY
        );
      }
    }

    // Day name labels
    for (let i = 0; i < 7; i++) {
      const x = startX + i * (daySize + daySpacing);
      createNoirText(this, x, timelineY + daySize / 2 + 15, DAY_NAMES[i] || '', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
        scale: mobile ? 0.7 : 0.8,
      });
    }
  }

  private createDayNode(
    x: number,
    y: number,
    size: number,
    dayNumber: number,
    status: ChapterStatus | undefined,
    mobile: boolean
  ): GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();

    // Determine colors based on status
    let bgColor = 0x1a1a2e;
    let borderColor = 0x333333;
    let textColor: 'white' | 'green' | 'gold' | 'gray' = 'gray';

    if (status?.isCompleted) {
      bgColor = 0x0a2a0a;
      borderColor = 0x00ff00;
      textColor = 'green';
    } else if (status?.isCurrent) {
      bgColor = 0x2a2a0a;
      borderColor = 0xffd700;
      textColor = 'gold';
    } else if (status?.isUnlocked) {
      bgColor = 0x1a1a2e;
      borderColor = 0x6c5ce7;
      textColor = 'white';
    }

    // Background circle
    bg.fillStyle(bgColor, 0.95);
    bg.fillCircle(0, 0, size / 2);
    bg.lineStyle(3, borderColor, 1);
    bg.strokeCircle(0, 0, size / 2);
    container.add(bg);

    // Day number or status icon
    if (status?.isCompleted) {
      // Checkmark for completed
      const checkGraphics = this.add.graphics();
      checkGraphics.lineStyle(3, 0x00ff00, 1);
      const checkSize = size * 0.25;
      checkGraphics.beginPath();
      checkGraphics.moveTo(-checkSize, 0);
      checkGraphics.lineTo(-checkSize / 3, checkSize * 0.7);
      checkGraphics.lineTo(checkSize, -checkSize * 0.5);
      checkGraphics.strokePath();
      container.add(checkGraphics);
    } else if (!status?.isUnlocked) {
      // Lock icon for locked days
      const lockGraphics = this.add.graphics();
      lockGraphics.lineStyle(2, 0x666666, 1);
      const lockSize = size * 0.2;
      // Lock body
      lockGraphics.fillStyle(0x666666, 1);
      lockGraphics.fillRect(-lockSize, -lockSize * 0.3, lockSize * 2, lockSize * 1.3);
      // Lock shackle
      lockGraphics.strokeCircle(0, -lockSize * 0.5, lockSize * 0.6);
      container.add(lockGraphics);
    } else {
      // Day number
      const dayText = createNoirText(this, 0, 0, String(dayNumber), {
        size: mobile ? 'medium' : 'large',
        color: textColor,
        origin: { x: 0.5, y: 0.5 },
      });
      container.add(dayText);
    }

    // Make clickable if available
    if (status?.isAvailable || status?.isCompleted) {
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, size / 2),
        Phaser.Geom.Circle.Contains
      );

      container.on('pointerover', () => {
        container.setScale(1.1);
      });

      container.on('pointerout', () => {
        container.setScale(1.0);
      });

      container.on('pointerdown', () => {
        this.onDaySelected(dayNumber, status);
      });
    }

    return container;
  }

  private onDaySelected(dayNumber: number, status: ChapterStatus | undefined): void {
    if (!status) return;

    // Navigate to chapter scene
    transitionToScene(this, 'ChapterScene', {
      dayNumber,
      weeklyCase: this.weeklyCase,
      progress: this.progress,
    });
  }

  private createCurrentChapterPanel(width: number, height: number, mobile: boolean): void {
    const panelY = mobile ? 260 : 320;
    const panelWidth = mobile ? width - 40 : Math.min(500, width - 80);
    const panelHeight = mobile ? 120 : 150;

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 0.95);
    panelBg.fillRoundedRect(width / 2 - panelWidth / 2, panelY, panelWidth, panelHeight, 10);
    panelBg.lineStyle(2, 0x6c5ce7, 0.5);
    panelBg.strokeRoundedRect(width / 2 - panelWidth / 2, panelY, panelWidth, panelHeight, 10);

    // Find current playable chapter
    const currentStatus = this.chapterStatuses.find((s) => s.isCurrent);
    const currentChapter = this.weeklyCase?.chapters.find(
      (c) => c.dayNumber === currentStatus?.dayNumber
    );

    if (currentStatus && currentChapter) {
      // Current chapter title
      createNoirText(this, width / 2, panelY + 25, `DAY ${currentStatus.dayNumber}: ${currentStatus.title.toUpperCase()}`, {
        size: 'medium',
        color: 'gold',
        origin: { x: 0.5, y: 0.5 },
      });

      // Chapter intro preview
      const introPreview = currentChapter.intro.substring(0, 80) + '...';
      createNoirText(this, width / 2, panelY + 55, introPreview.toUpperCase(), {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
        maxWidth: panelWidth - 40,
      });

      // Play button
      createNoirButton(this, width / 2, panelY + panelHeight - 30, '[ PLAY CHAPTER ]', {
        size: 'medium',
        color: 'green',
        hoverColor: 'cyan',
        onClick: () => this.onDaySelected(currentStatus.dayNumber, currentStatus),
        padding: { x: 20, y: 10 },
      });
    } else if (this.isAccusationUnlocked && !this.progress?.solved) {
      // Accusation day
      createNoirText(this, width / 2, panelY + 30, 'ACCUSATION DAY', {
        size: 'large',
        color: 'red',
        origin: { x: 0.5, y: 0.5 },
      });

      createNoirText(this, width / 2, panelY + 60, 'TIME TO CATCH THE KILLER!', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });

      createNoirButton(this, width / 2, panelY + panelHeight - 30, '[ MAKE ACCUSATION ]', {
        size: 'medium',
        color: 'red',
        hoverColor: 'gold',
        onClick: () => transitionToScene(this, 'Accusation', { weeklyMode: true }),
        padding: { x: 20, y: 10 },
      });
    } else if (this.progress?.solved) {
      // Already solved
      const resultText = this.progress.correct ? 'CASE SOLVED!' : 'CASE FAILED';
      const resultColor = this.progress.correct ? 'green' : 'red';

      createNoirText(this, width / 2, panelY + 40, resultText, {
        size: 'large',
        color: resultColor as 'green' | 'red',
        origin: { x: 0.5, y: 0.5 },
      });

      createNoirText(this, width / 2, panelY + 75, 'COME BACK NEXT WEEK FOR A NEW MYSTERY', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
    } else {
      // All chapters complete, waiting for Sunday
      createNoirText(this, width / 2, panelY + 40, 'CHAPTERS COMPLETE', {
        size: 'medium',
        color: 'cyan',
        origin: { x: 0.5, y: 0.5 },
      });

      createNoirText(this, width / 2, panelY + 70, 'ACCUSATION UNLOCKS ON SUNDAY', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
    }
  }

  private createBottomButtons(width: number, height: number, mobile: boolean): void {
    const buttonY = height - (mobile ? 50 : 60);
    const buttonSpacing = mobile ? 100 : 150;

    // Review Evidence button
    createNoirButton(this, width / 2 - buttonSpacing, buttonY, '[ EVIDENCE ]', {
      size: 'small',
      color: 'cyan',
      hoverColor: 'white',
      onClick: () => this.goToEvidence(),
      padding: { x: 15, y: 8 },
    });

    // Back to Menu button
    createNoirButton(this, width / 2, buttonY, '[ MENU ]', {
      size: 'small',
      color: 'white',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'MainMenu'),
      padding: { x: 15, y: 8 },
    });

    // Suspects Gallery button
    createNoirButton(this, width / 2 + buttonSpacing, buttonY, '[ SUSPECTS ]', {
      size: 'small',
      color: 'red',
      hoverColor: 'gold',
      onClick: () => this.goToSuspects(),
      padding: { x: 15, y: 8 },
    });
  }

  private goToEvidence(): void {
    transitionToScene(this, 'Evidence', {
      weeklyMode: true,
      weeklyCase: this.weeklyCase,
      progress: this.progress,
    });
  }

  private goToSuspects(): void {
    transitionToScene(this, 'Interrogation', {
      weeklyMode: true,
      weeklyCase: this.weeklyCase,
      progress: this.progress,
    });
  }
}
