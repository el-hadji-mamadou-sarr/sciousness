import { Scene, GameObjects } from 'phaser';
import {
  Case,
  Suspect,
  DialogueOption,
  PlayerProgress,
  FindClueResponse,
  WeeklyCase,
  WeeklyProgress,
  Witness,
} from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { drawSuspectPortrait } from '../utils/ProceduralGraphics';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen, getScaleFactor } from '../utils/NoirText';
import { GameStateManager } from '../utils/GameStateManager';
import { QuickNotes } from '../utils/QuickNotes';

// Interviewee can be either a Suspect or Witness
type Interviewee = Suspect | Witness;

// Weekly mode scene data interface
interface WeeklyInterrogationData {
  weeklyMode?: boolean;
  weeklyCase?: WeeklyCase;
  progress?: WeeklyProgress;
  currentChapter?: number;
}

export class Interrogation extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private currentSuspect: Suspect | null = null;
  private currentSuspectIndex: number = 0;
  private dialogueContainer: GameObjects.Container | null = null;
  private suspectPanel: GameObjects.Container | null = null;
  private currentDialogueOptions: DialogueOption[] = [];
  private quickNotes: QuickNotes | null = null;

  // Weekly mode properties
  private weeklyMode: boolean = false;
  private weeklyCase: WeeklyCase | null = null;
  private weeklyProgress: WeeklyProgress | null = null;
  private currentChapter: number = 1;
  private interviewees: Interviewee[] = [];

  constructor() {
    super('Interrogation');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  init(data?: WeeklyInterrogationData): void {
    // Reset weekly mode properties
    this.weeklyMode = false;
    this.weeklyCase = null;
    this.weeklyProgress = null;
    this.currentChapter = 1;
    this.interviewees = [];

    // Check if we're in weekly mode
    if (data?.weeklyMode && data.weeklyCase) {
      this.weeklyMode = true;
      this.weeklyCase = data.weeklyCase;
      this.weeklyProgress = data.progress || null;
      this.currentChapter = data.currentChapter || 1;
    }
  }

  async create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0f0f1a);
    this.createScanlines(width, height);

    createNoirText(this, width / 2, this.isMobile() ? 18 : 25, 'INTERROGATION', {
      size: 'large',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    await this.loadGameData();

    // Restore suspect index from GameStateManager
    this.currentSuspectIndex = GameStateManager.getCurrentSuspectIndex();

    this.createSuspectPanel(width, height);
    this.createDialoguePanel(width, height);
    this.createNavigationButtons(width, height);
    this.showSuspect(this.currentSuspectIndex);

    // Add quick notes button
    if (this.currentCase) {
      this.quickNotes = new QuickNotes(this, this.currentCase.id);
    }

    this.scale.on('resize', () => this.scene.restart());
  }

  private createScanlines(width: number, height: number): void {
    const graphics = this.add.graphics();
    const spacing = this.isMobile() ? 5 : 3;
    graphics.lineStyle(1, 0x000000, 0.1);
    for (let y = 0; y < height; y += spacing) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  private async loadGameData(): Promise<void> {
    // If in weekly mode, build interviewees from weekly data
    if (this.weeklyMode && this.weeklyCase) {
      this.buildIntervieweesFromWeeklyData();
      this.currentCase = this.buildCaseFromWeeklyData();
      this.progress = this.buildProgressFromWeeklyData();
      return;
    }

    // Standard daily mode
    try {
      const data = await GameStateManager.loadGameData();
      this.currentCase = data.currentCase;
      this.progress = data.progress;
    } catch (error) {
      console.error('Failed to load game data:', error);
      this.createFallbackCase();
    }
  }

  private createFallbackCase(): void {
    this.currentCase = { ...case1 };
    this.progress = { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
  }

  // Build list of available interviewees (suspects + witnesses) for current chapter
  private buildIntervieweesFromWeeklyData(): void {
    if (!this.weeklyCase || !this.weeklyProgress) {
      this.interviewees = [];
      return;
    }

    // Get revealed suspects
    const revealedSuspects = this.weeklyCase.suspects.filter(s =>
      this.weeklyProgress!.suspectsRevealed.includes(s.id)
    );

    // Get available witnesses from chapters up to current
    const availableWitnesses: Witness[] = [];
    for (const chapter of this.weeklyCase.chapters) {
      if (chapter.dayNumber <= this.currentChapter) {
        availableWitnesses.push(...chapter.witnesses);
      }
    }

    // Combine suspects and witnesses
    this.interviewees = [...revealedSuspects, ...availableWitnesses];
  }

  // Build a Case object from WeeklyCase data
  private buildCaseFromWeeklyData(): Case {
    if (!this.weeklyCase) {
      return { ...case1 };
    }

    // Convert interviewees to suspects format for compatibility
    const suspectsFromInterviewees: Suspect[] = this.interviewees.map(i => {
      // Check if it's a Witness (has availableOnDay) or Suspect (has isGuilty)
      if ('isGuilty' in i) {
        return i as Suspect;
      }
      // Convert Witness to Suspect-like structure
      const witness = i as Witness;
      const suspect: Suspect = {
        id: witness.id,
        name: witness.name,
        description: witness.description,
        alibi: 'N/A - Witness',
        isGuilty: false,
        dialogueOptions: witness.dialogueOptions,
      };
      if (witness.portrait) {
        suspect.portrait = witness.portrait;
      }
      return suspect;
    });

    return {
      id: this.weeklyCase.id,
      title: this.weeklyCase.title,
      dayNumber: this.currentChapter,
      intro: this.weeklyCase.overallIntro,
      victimName: this.weeklyCase.victimName,
      victimDescription: this.weeklyCase.victimDescription,
      location: this.weeklyCase.location,
      crimeSceneObjects: [],
      suspects: suspectsFromInterviewees,
      clues: this.weeklyCase.allClues,
    };
  }

  // Build PlayerProgress from WeeklyProgress
  private buildProgressFromWeeklyData(): PlayerProgress {
    if (!this.weeklyProgress) {
      return { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
    }

    const allFoundClues = Object.values(this.weeklyProgress.cluesFoundByChapter).flat();

    const progress: PlayerProgress = {
      odayNumber: this.currentChapter,
      cluesFound: allFoundClues,
      suspectsInterrogated: this.weeklyProgress.witnessesInterrogated,
      solved: this.weeklyProgress.solved,
      correct: this.weeklyProgress.correct,
    };

    if (this.weeklyProgress.accusedSuspect) {
      progress.accusedSuspect = this.weeklyProgress.accusedSuspect;
    }

    return progress;
  }

  private createSuspectPanel(width: number, _height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    this.suspectPanel = this.add.container(width / 2, mobile ? 115 : Math.round(180 * scale));
  }

  private showSuspect(index: number): void {
    if (!this.currentCase || !this.suspectPanel) return;

    const suspects = this.currentCase.suspects;
    if (index < 0 || index >= suspects.length) return;

    const suspect = suspects[index];
    if (!suspect) return;

    this.currentSuspect = suspect;
    this.currentSuspectIndex = index;
    // Save suspect index to GameStateManager for persistence
    GameStateManager.setCurrentSuspectIndex(index);
    this.suspectPanel.removeAll(true);

    const { width } = this.scale;
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const panelWidth = mobile ? width - 16 : Math.min(width - Math.round(100 * scale), Math.round(900 * scale));
    const panelHeight = mobile ? 220 : Math.round(300 * scale);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    bg.lineStyle(2, 0xff4444, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    this.suspectPanel.add(bg);

    const portraitSize = mobile ? 55 : Math.round(110 * scale);
    const portrait = this.add.graphics();
    const portraitX = -panelWidth / 2 + 15 + portraitSize / 2;
    const portraitY = -panelHeight / 2 + 15 + portraitSize / 2;
    drawSuspectPortrait(portrait, portraitX, portraitY, portraitSize, suspect.id, suspect.isGuilty);
    this.suspectPanel.add(portrait);

    const textX = -panelWidth / 2 + portraitSize + 35;

    this.suspectPanel.add(createNoirText(this, textX, -panelHeight / 2 + 18, suspect.name.toUpperCase(), {
      size: 'medium',
      color: 'white',
      origin: { x: 0, y: 0 },
    }));

    this.suspectPanel.add(createNoirText(this, textX, -panelHeight / 2 + 45, suspect.description.toUpperCase(), {
      size: 'small',
      color: 'gray',
      origin: { x: 0, y: 0 },
      maxWidth: panelWidth - portraitSize - 55,
    }));

    this.suspectPanel.add(createNoirText(this, -panelWidth / 2 + 15, -5, 'ALIBI:', {
      size: 'small',
      color: 'red',
      origin: { x: 0, y: 0 },
    }));

    this.suspectPanel.add(createNoirText(this, -panelWidth / 2 + 15, 15, suspect.alibi.toUpperCase(), {
      size: 'small',
      color: 'lightGray',
      origin: { x: 0, y: 0 },
      maxWidth: panelWidth - 30,
    }));

    const navY = panelHeight / 2 - 22;

    if (index > 0) {
      const prevBtn = createNoirButton(this, -panelWidth / 2 + 30, navY, '<', {
        size: 'large',
        color: 'green',
        hoverColor: 'cyan',
        onClick: () => this.showSuspect(index - 1),
        padding: { x: 12, y: 6 },
      });
      this.suspectPanel.add(prevBtn);
    }

    this.suspectPanel.add(createNoirText(this, 0, navY, `${index + 1}/${suspects.length}`, {
      size: 'medium',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    }));

    if (index < suspects.length - 1) {
      const nextBtn = createNoirButton(this, panelWidth / 2 - 30, navY, '>', {
        size: 'large',
        color: 'green',
        hoverColor: 'cyan',
        onClick: () => this.showSuspect(index + 1),
        padding: { x: 12, y: 6 },
      });
      this.suspectPanel.add(nextBtn);
    }

    // Restore dialogue state from GameStateManager or set initial options
    const savedOptionIds = GameStateManager.getCurrentDialogueOptions(suspect.id);
    if (savedOptionIds.length > 0) {
      // Restore saved dialogue options
      this.currentDialogueOptions = suspect.dialogueOptions.filter((opt) =>
        savedOptionIds.includes(opt.id)
      );
    } else {
      // Set initial dialogue options (first level questions only)
      this.currentDialogueOptions = suspect.dialogueOptions.filter(
        (opt) => !opt.id.includes('_2') && !opt.id.includes('_3') && !opt.id.includes('_4')
      );
      // Save initial state
      GameStateManager.setCurrentDialogueOptions(
        suspect.id,
        this.currentDialogueOptions.map((opt) => opt.id)
      );
    }
    this.showDialogueOptions();
  }

  private createDialoguePanel(width: number, height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    this.dialogueContainer = this.add.container(width / 2, mobile ? height / 2 + 115 : height / 2 + Math.round(160 * scale));
  }

  private showDialogueOptions(): void {
    if (!this.dialogueContainer || !this.currentSuspect) return;

    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const panelWidth = mobile ? width - 16 : Math.min(width - Math.round(100 * scale), Math.round(900 * scale));
    const panelHeight = height - (mobile ? 340 : Math.round(500 * scale));

    this.dialogueContainer.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    bg.lineStyle(1, 0x394867, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    this.dialogueContainer.add(bg);

    this.dialogueContainer.add(createNoirText(this, 0, -panelHeight / 2 + 15, 'WHAT TO ASK?', {
      size: 'small',
      color: 'gold',
      origin: { x: 0.5, y: 0 },
    }));

    let yOffset = -panelHeight / 2 + 45;
    const options = this.currentDialogueOptions.length > 0
      ? this.currentDialogueOptions
      : this.currentSuspect.dialogueOptions.slice(0, 3);

    if (options.length === 0) {
      // No more questions available for this dialogue branch
      this.dialogueContainer.add(createNoirText(this, 0, yOffset + 20, 'NO MORE QUESTIONS', {
        size: 'medium',
        color: 'gray',
        origin: { x: 0.5, y: 0 },
      }));
      this.dialogueContainer.add(createNoirText(this, 0, yOffset + 50, 'USE NAVIGATION TO CONTINUE', {
        size: 'small',
        color: 'darkGray',
        origin: { x: 0.5, y: 0 },
      }));
      return;
    }

    options.forEach((option, idx) => {
      const optionText = createNoirText(this, -panelWidth / 2 + 15, yOffset, `${idx + 1}. ${option.text.toUpperCase()}`, {
        size: 'small',
        color: 'cyan',
        origin: { x: 0, y: 0 },
        maxWidth: panelWidth - 30,
      });

      optionText.setInteractive({ useHandCursor: true });
      optionText.on('pointerover', () => optionText.setTint(0xffffff));
      optionText.on('pointerout', () => optionText.clearTint());
      optionText.on('pointerdown', () => this.selectDialogue(option));

      this.dialogueContainer!.add(optionText);
      yOffset += mobile ? 45 : 50;
    });
  }

  private async selectDialogue(option: DialogueOption): Promise<void> {
    if (!this.dialogueContainer || !this.currentSuspect) return;

    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const panelWidth = mobile ? width - 16 : Math.min(width - Math.round(100 * scale), Math.round(900 * scale));
    const panelHeight = height - (mobile ? 340 : Math.round(500 * scale));

    this.dialogueContainer.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    bg.lineStyle(1, option.isSuspicious ? 0xff4444 : 0x394867, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    this.dialogueContainer.add(bg);

    this.dialogueContainer.add(createNoirText(this, -panelWidth / 2 + 12, -panelHeight / 2 + 15, 'YOU:', {
      size: 'small',
      color: 'green',
      origin: { x: 0, y: 0 },
    }));

    this.dialogueContainer.add(createNoirText(this, -panelWidth / 2 + 12, -panelHeight / 2 + 35, `"${option.text.toUpperCase()}"`, {
      size: 'small',
      color: 'white',
      origin: { x: 0, y: 0 },
      maxWidth: panelWidth - 24,
    }));

    const responseY = -panelHeight / 2 + (mobile ? 75 : 90);
    this.dialogueContainer.add(createNoirText(this, -panelWidth / 2 + 12, responseY, `${this.currentSuspect.name.toUpperCase()}:`, {
      size: 'small',
      color: option.isSuspicious ? 'red' : 'gold',
      origin: { x: 0, y: 0 },
    }));

    this.dialogueContainer.add(createNoirText(this, -panelWidth / 2 + 12, responseY + 22, `"${option.response.toUpperCase()}"`, {
      size: 'small',
      color: 'lightGray',
      origin: { x: 0, y: 0 },
      maxWidth: panelWidth - 24,
    }));

    if (option.isSuspicious) {
      this.dialogueContainer.add(createNoirText(this, panelWidth / 2 - 15, -panelHeight / 2 + 15, 'SUSPICIOUS', {
        size: 'small',
        color: 'red',
        origin: { x: 1, y: 0 },
      }));
    }

    if (option.unlocksClue) {
      await this.findClue(option.unlocksClue);
    }

    const continueBtn = createNoirButton(this, 0, panelHeight / 2 - 30, '[CONTINUE]', {
      size: 'small',
      color: 'green',
      hoverColor: 'cyan',
      onClick: () => {
        if (option.nextOptions && this.currentSuspect) {
          this.currentDialogueOptions = this.currentSuspect.dialogueOptions.filter((opt) =>
            option.nextOptions!.includes(opt.id)
          );
        } else {
          this.currentDialogueOptions = [];
        }
        // Save current dialogue options to GameStateManager
        if (this.currentSuspect) {
          GameStateManager.setCurrentDialogueOptions(
            this.currentSuspect.id,
            this.currentDialogueOptions.map((opt) => opt.id)
          );
        }
        this.showDialogueOptions();
      },
      padding: { x: 15, y: 8 },
    });
    this.dialogueContainer.add(continueBtn);
  }

  private async findClue(clueId: string): Promise<void> {
    if (this.progress?.cluesFound.includes(clueId)) return;
    try {
      // Use different API for weekly mode
      if (this.weeklyMode) {
        const response = await fetch('/api/weekly/find-clue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clueId, chapterDay: this.currentChapter }),
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        this.weeklyProgress = data.progress;
        this.progress = this.buildProgressFromWeeklyData();
        this.showClueNotification(data.clue.name);
        return;
      }

      // Standard daily mode
      const response = await fetch('/api/game/find-clue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clueId }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = (await response.json()) as FindClueResponse;
      this.progress = data.progress;
      // Update GameStateManager with new progress
      GameStateManager.updateProgress(data.progress);
      this.showClueNotification(data.clue.name);
    } catch (error) {
      console.error('Failed to find clue:', error);
      if (this.progress) {
        this.progress.cluesFound.push(clueId);
        if (!this.weeklyMode) {
          GameStateManager.updateProgress(this.progress);
        }
      }
    }
  }

  private showClueNotification(clueName: string): void {
    const { width } = this.scale;
    const notification = createNoirText(this, width / 2, this.isMobile() ? 42 : 55, `NEW CLUE: ${clueName.toUpperCase()}`, {
      size: 'small',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });
    notification.setAlpha(0);

    this.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 2000,
      onComplete: () => notification.destroy(),
    });
  }

  private createNavigationButtons(width: number, height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const navHeight = mobile ? 50 : Math.round(80 * scale);
    const btnY = height - navHeight / 2;

    // Create bottom nav bar background
    const navBg = this.add.graphics();
    navBg.fillStyle(0x0a0a14, 0.95);
    navBg.fillRect(0, height - navHeight, width, navHeight);
    navBg.lineStyle(1, 0x333333, 0.8);
    navBg.lineBetween(0, height - navHeight, width, height - navHeight);

    // Distribute 3 buttons evenly: at 1/6, 3/6 (center), and 5/6 of width
    const btnX1 = width / 6;
    const btnX2 = width / 2;
    const btnX3 = (width * 5) / 6;

    createNoirButton(this, btnX1, btnY, '[SCENE]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'white',
      onClick: () => this.goToCrimeScene(),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });

    createNoirButton(this, btnX2, btnY, this.weeklyMode ? '[BACK]' : '[NOTES]', {
      size: 'small',
      color: 'gold',
      hoverColor: 'white',
      onClick: () => this.weeklyMode ? this.goBack() : this.quickNotes?.open(),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });

    createNoirButton(this, btnX3, btnY, '[ACCUSE]', {
      size: 'small',
      color: 'red',
      hoverColor: 'gold',
      onClick: () => this.goToAccusation(),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });
  }

  private goToCrimeScene(): void {
    if (this.weeklyMode) {
      transitionToScene(this, 'CrimeScene', {
        weeklyMode: true,
        weeklyCase: this.weeklyCase,
        progress: this.weeklyProgress,
        currentChapter: this.currentChapter,
      });
    } else {
      transitionToScene(this, 'CrimeScene');
    }
  }

  private goToAccusation(): void {
    if (this.weeklyMode) {
      transitionToScene(this, 'Accusation', {
        weeklyMode: true,
        weeklyCase: this.weeklyCase,
        progress: this.weeklyProgress,
      });
    } else {
      transitionToScene(this, 'Accusation');
    }
  }

  private goBack(): void {
    if (this.weeklyMode) {
      transitionToScene(this, 'ChapterScene', {
        dayNumber: this.currentChapter,
        weeklyCase: this.weeklyCase,
        progress: this.weeklyProgress,
      });
    } else {
      transitionToScene(this, 'MainMenu');
    }
  }
}
