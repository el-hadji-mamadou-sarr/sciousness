import { Scene, GameObjects } from 'phaser';
import {
  Case,
  Suspect,
  DialogueOption,
  PlayerProgress,
  FindClueResponse,
} from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { drawSuspectPortrait } from '../utils/ProceduralGraphics';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';
import { GameStateManager } from '../utils/GameStateManager';

export class Interrogation extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private currentSuspect: Suspect | null = null;
  private currentSuspectIndex: number = 0;
  private dialogueContainer: GameObjects.Container | null = null;
  private suspectPanel: GameObjects.Container | null = null;
  private currentDialogueOptions: DialogueOption[] = [];

  constructor() {
    super('Interrogation');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
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

  private createSuspectPanel(width: number, _height: number): void {
    const mobile = this.isMobile();
    this.suspectPanel = this.add.container(width / 2, mobile ? 115 : 130);
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
    const panelWidth = width - (mobile ? 16 : 60);
    const panelHeight = mobile ? 220 : 210;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    bg.lineStyle(2, 0xff4444, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    this.suspectPanel.add(bg);

    const portraitSize = mobile ? 55 : 70;
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
    this.dialogueContainer = this.add.container(width / 2, mobile ? height / 2 + 115 : height / 2 + 110);
  }

  private showDialogueOptions(): void {
    if (!this.dialogueContainer || !this.currentSuspect) return;

    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const panelWidth = width - (mobile ? 16 : 60);
    const panelHeight = height - (mobile ? 340 : 360);

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
    const panelWidth = width - (mobile ? 16 : 60);
    const panelHeight = height - (mobile ? 340 : 360);

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
        GameStateManager.updateProgress(this.progress);
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
    const navHeight = mobile ? 50 : 60;
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
      onClick: () => transitionToScene(this, 'CrimeScene'),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });

    createNoirButton(this, btnX2, btnY, mobile ? '[NOTES]' : '[NOTEBOOK]', {
      size: 'small',
      color: 'gold',
      hoverColor: 'white',
      onClick: () => transitionToScene(this, 'Notebook', { returnTo: 'Interrogation' }),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });

    createNoirButton(this, btnX3, btnY, '[ACCUSE]', {
      size: 'small',
      color: 'red',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'Accusation'),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });
  }
}
