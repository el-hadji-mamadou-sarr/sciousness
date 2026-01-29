import { Scene, GameObjects } from 'phaser';
import {
  WeeklyCase,
  WeeklyProgress,
  Chapter,
  CompleteChapterResponse,
} from '../../../shared/types/game';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, createScrollableTextBox, isMobileScreen, getScaleFactor } from '../utils/NoirText';

interface ChapterSceneData {
  dayNumber: number;
  weeklyCase: WeeklyCase;
  progress: WeeklyProgress;
}

export class ChapterScene extends Scene {
  private dayNumber: number = 1;
  private weeklyCase: WeeklyCase | null = null;
  private progress: WeeklyProgress | null = null;
  private currentChapter: Chapter | null = null;

  private storyContainer: GameObjects.Container | null = null;
  private hasReadStory: boolean = false;
  private hasViewedEvidence: boolean = false;

  constructor() {
    super('ChapterScene');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  init(data: ChapterSceneData): void {
    this.dayNumber = data.dayNumber;
    this.weeklyCase = data.weeklyCase;
    this.progress = data.progress;
    this.currentChapter = this.weeklyCase?.chapters.find(c => c.dayNumber === this.dayNumber) || null;
    this.hasReadStory = false;
    this.hasViewedEvidence = false;
  }

  async create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createBackground(width, height);

    if (this.currentChapter) {
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

    // Ambient glow - dramatic red for story
    const glow = this.add.graphics();
    glow.fillStyle(0x8b0000, 0.04);
    glow.fillCircle(width * 0.5, height * 0.3, 300);
  }

  private createErrorState(width: number, height: number): void {
    createNoirText(this, width / 2, height / 2, 'CHAPTER NOT FOUND', {
      size: 'large',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirButton(this, width / 2, height - 60, '[ BACK ]', {
      size: 'medium',
      color: 'white',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'WeekOverview'),
      padding: { x: 25, y: 12 },
    });
  }

  private createLayout(width: number, height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const chapter = this.currentChapter!;

    // Header
    createNoirText(this, width / 2, mobile ? 25 : 35, `DAY ${this.dayNumber}`, {
      size: 'medium',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    // Chapter title
    createNoirText(this, width / 2, mobile ? 55 : 70, chapter.title.toUpperCase(), {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    // Decorative line
    const lineGraphics = this.add.graphics();
    lineGraphics.lineStyle(2, 0xff4444, 0.4);
    lineGraphics.lineBetween(width * 0.2, mobile ? 75 : 95, width * 0.8, mobile ? 75 : 95);

    // Story text panel
    this.createStoryPanel(width, height, mobile, chapter);

    // New evidence notification (if any)
    if (chapter.newClues.length > 0) {
      this.createEvidenceNotification(width, height, mobile, chapter);
    }

    // Navigation buttons
    this.createNavigationButtons(width, height, mobile);
  }

  private createStoryPanel(width: number, height: number, mobile: boolean, chapter: Chapter): void {
    const panelY = mobile ? 90 : 120;
    const panelWidth = mobile ? width - 30 : Math.min(600, width - 80);
    const panelHeight = mobile ? height - 250 : height - 320;

    // Full story text (intro + main story)
    const fullStory = `${chapter.intro}\n\n${chapter.storyText}`;

    // Create scrollable text box
    this.storyContainer = createScrollableTextBox(
      this,
      width / 2 - panelWidth / 2,
      panelY,
      panelWidth,
      panelHeight,
      fullStory.toUpperCase(),
      {
        fontSize: mobile ? 14 : 16,
        lineSpacing: mobile ? 4 : 6,
        backgroundColor: 0x12121f,
        textColor: '#cccccc',
        padding: 15,
      }
    );

    // Mark story as read after a short delay (simulating reading)
    this.time.delayedCall(2000, () => {
      this.hasReadStory = true;
      this.checkChapterCompletion();
    });
  }

  private createEvidenceNotification(width: number, height: number, mobile: boolean, chapter: Chapter): void {
    const notifY = mobile ? height - 180 : height - 200;
    const notifWidth = mobile ? width - 40 : 400;
    const notifHeight = 60;

    // Notification background
    const notifBg = this.add.graphics();
    notifBg.fillStyle(0x1a2a1a, 0.95);
    notifBg.fillRoundedRect(width / 2 - notifWidth / 2, notifY, notifWidth, notifHeight, 8);
    notifBg.lineStyle(2, 0x00ff00, 0.7);
    notifBg.strokeRoundedRect(width / 2 - notifWidth / 2, notifY, notifWidth, notifHeight, 8);

    // Notification icon and text
    createNoirText(this, width / 2, notifY + 18, 'NEW EVIDENCE UNLOCKED', {
      size: 'small',
      color: 'green',
      origin: { x: 0.5, y: 0.5 },
    });

    // List new clues
    const clueNames = chapter.newClues.map(c => c.name).join(', ');
    createNoirText(this, width / 2, notifY + 40, clueNames.toUpperCase(), {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
      scale: 0.8,
      maxWidth: notifWidth - 20,
    });

    // Mark evidence as viewed
    this.hasViewedEvidence = true;
  }

  private createNavigationButtons(width: number, height: number, mobile: boolean): void {
    const buttonY = height - (mobile ? 50 : 60);
    const buttonSpacing = mobile ? 80 : 120;

    // Investigate button (go to CrimeScene)
    createNoirButton(this, width / 2 - buttonSpacing, buttonY, '[ INVESTIGATE ]', {
      size: 'small',
      color: 'cyan',
      hoverColor: 'white',
      onClick: () => this.goToInvestigate(),
      padding: { x: 12, y: 8 },
    });

    // Complete/Continue button
    const isChapterCompleted = this.progress?.chaptersCompleted.includes(this.dayNumber);
    const completeButtonText = isChapterCompleted ? '[ CONTINUE ]' : '[ COMPLETE ]';
    const completeButtonColor = isChapterCompleted ? 'white' : 'gold';

    createNoirButton(this, width / 2, buttonY, completeButtonText, {
      size: 'small',
      color: completeButtonColor as 'white' | 'gold',
      hoverColor: 'green',
      onClick: () => this.completeChapter(),
      padding: { x: 12, y: 8 },
    });

    // Interrogate button
    createNoirButton(this, width / 2 + buttonSpacing, buttonY, '[ INTERROGATE ]', {
      size: 'small',
      color: 'red',
      hoverColor: 'gold',
      onClick: () => this.goToInterrogate(),
      padding: { x: 12, y: 8 },
    });

    // Back button (top left)
    createNoirButton(this, mobile ? 50 : 70, mobile ? 25 : 35, '[ BACK ]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'white',
      onClick: () => transitionToScene(this, 'WeekOverview'),
      padding: { x: 10, y: 6 },
    });
  }

  private goToInvestigate(): void {
    transitionToScene(this, 'CrimeScene', {
      weeklyMode: true,
      weeklyCase: this.weeklyCase,
      progress: this.progress,
      currentChapter: this.dayNumber,
    });
  }

  private goToInterrogate(): void {
    transitionToScene(this, 'Interrogation', {
      weeklyMode: true,
      weeklyCase: this.weeklyCase,
      progress: this.progress,
      currentChapter: this.dayNumber,
    });
  }

  private checkChapterCompletion(): void {
    // Auto-complete logic could go here
    // For now, we require manual completion via button
  }

  private async completeChapter(): Promise<void> {
    // Check if already completed
    if (this.progress?.chaptersCompleted.includes(this.dayNumber)) {
      // Already completed, just go back to overview
      transitionToScene(this, 'WeekOverview');
      return;
    }

    try {
      const response = await fetch('/api/weekly/complete-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterDay: this.dayNumber }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as CompleteChapterResponse;

      // Show completion notification
      this.showCompletionNotification(data);

      // Update local progress
      this.progress = data.progress;

    } catch (error) {
      console.error('Failed to complete chapter:', error);
      // Still navigate back on error
      transitionToScene(this, 'WeekOverview');
    }
  }

  private showCompletionNotification(data: CompleteChapterResponse): void {
    const { width, height } = this.scale;
    const mobile = this.isMobile();

    // Overlay background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(100);

    // Notification panel
    const panelWidth = mobile ? width - 40 : 400;
    const panelHeight = mobile ? 200 : 220;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    panel.lineStyle(3, 0x00ff00, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    panel.setDepth(101);

    // Chapter complete text
    const completeText = createNoirText(this, width / 2, panelY + 35, 'CHAPTER COMPLETE!', {
      size: 'large',
      color: 'green',
      origin: { x: 0.5, y: 0.5 },
    });
    completeText.setDepth(102);

    // Points earned
    const pointsText = createNoirText(this, width / 2, panelY + 75, `+${data.pointsEarned} POINTS`, {
      size: 'medium',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });
    pointsText.setDepth(102);

    // Bonus breakdown
    let bonusY = panelY + 105;

    if (data.streakBonus > 0) {
      const streakText = createNoirText(this, width / 2, bonusY, `STREAK BONUS: +${data.streakBonus}`, {
        size: 'small',
        color: 'cyan',
        origin: { x: 0.5, y: 0.5 },
      });
      streakText.setDepth(102);
      bonusY += 25;
    }

    if (data.onTimeBonus > 0) {
      const onTimeText = createNoirText(this, width / 2, bonusY, `ON-TIME BONUS: +${data.onTimeBonus}`, {
        size: 'small',
        color: 'cyan',
        origin: { x: 0.5, y: 0.5 },
      });
      onTimeText.setDepth(102);
    }

    // Continue button
    const continueBtn = createNoirButton(this, width / 2, panelY + panelHeight - 35, '[ CONTINUE ]', {
      size: 'medium',
      color: 'white',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'WeekOverview'),
      padding: { x: 20, y: 10 },
    });
    continueBtn.setDepth(102);
  }
}
