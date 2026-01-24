import { Scene, GameObjects } from 'phaser';
import {
  Case,
  Suspect,
  DialogueOption,
  PlayerProgress,
  InitGameResponse,
  FindClueResponse,
} from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { drawSuspectPortrait } from '../utils/ProceduralGraphics';
import { transitionToScene } from '../utils/SceneTransition';

export class Interrogation extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private currentSuspect: Suspect | null = null;
  private dialogueContainer: GameObjects.Container | null = null;
  private suspectPanel: GameObjects.Container | null = null;
  private currentDialogueOptions: DialogueOption[] = [];

  constructor() {
    super('Interrogation');
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
  

  async create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0f0f1a);
    this.createScanlines(width, height);

    // Title
    this.add
      .text(width / 2, this.isMobile() ? 18 : 25, 'INTERROGATION', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(18)}px`,
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    await this.loadGameData();

    this.createSuspectPanel(width, height);
    this.createDialoguePanel(width, height);
    this.createNavigationButtons(width, height);
    this.showSuspect(0);

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
      const response = await fetch('/api/game/init');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = (await response.json()) as InitGameResponse;
      this.currentCase = data.currentCase;
      this.progress = data.progress;
    } catch (error) {
      console.error('Failed to load game data:', error);
      this.createFallbackCase();
    }
  }

  private createFallbackCase(): void {
    // Use the case1 data from the crime-scenes folder
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
    this.suspectPanel.removeAll(true);

    const { width } = this.scale;
    const mobile = this.isMobile();
    const panelWidth = width - (mobile ? 16 : 60);
    const panelHeight = mobile ? 150 : 130;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    bg.lineStyle(2, 0xff4444, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    this.suspectPanel.add(bg);

    // Portrait - using procedural graphics generator
    const portraitSize = mobile ? 50 : 65;
    const portrait = this.add.graphics();
    const portraitX = -panelWidth / 2 + 10 + portraitSize / 2;
    const portraitY = -panelHeight / 2 + 10 + portraitSize / 2;
    drawSuspectPortrait(portrait, portraitX, portraitY, portraitSize, suspect.id, suspect.isGuilty);
    this.suspectPanel.add(portrait);

    const textX = -panelWidth / 2 + portraitSize + 25;

    // Name
    this.suspectPanel.add(this.add.text(textX, -panelHeight / 2 + 12, suspect.name, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(16)}px`, color: '#ffffff',
      resolution: 2,
    }));

    // Description
    this.suspectPanel.add(this.add.text(textX, -panelHeight / 2 + 38, suspect.description, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#aaaaaa',
      wordWrap: { width: panelWidth - portraitSize - 40 },
      resolution: 2,
    }));

    // Alibi - positioned in lower section
    this.suspectPanel.add(this.add.text(-panelWidth / 2 + 12, panelHeight / 2 - 50, 'ALIBI:', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#ff4444',
      resolution: 2,
    }));
    this.suspectPanel.add(this.add.text(-panelWidth / 2 + 75, panelHeight / 2 - 50, suspect.alibi, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#cccccc',
      wordWrap: { width: panelWidth - 95 },
      resolution: 2,
    }));

    // Navigation
    const navY = panelHeight / 2 - 18;
    const prevBtn = this.add
      .text(-panelWidth / 2 + 10, navY, '<', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(20)}px`,
        color: index > 0 ? '#00ff00' : '#333333',
      })
      .setInteractive({ useHandCursor: index > 0 })
      .on('pointerdown', () => { if (index > 0) this.showSuspect(index - 1); });
    this.suspectPanel.add(prevBtn);

    this.suspectPanel.add(this.add.text(0, navY, `${index + 1}/${suspects.length}`, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(14)}px`, color: '#666666',
      resolution: 2,
    }).setOrigin(0.5));

    const nextBtn = this.add
      .text(panelWidth / 2 - 10, navY, '>', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(20)}px`,
        color: index < suspects.length - 1 ? '#00ff00' : '#333333',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: index < suspects.length - 1 })
      .on('pointerdown', () => { if (index < suspects.length - 1) this.showSuspect(index + 1); });
    this.suspectPanel.add(nextBtn);

    this.currentDialogueOptions = suspect.dialogueOptions.filter(
      (opt) => !opt.id.includes('_2') && !opt.id.includes('_3') && !opt.id.includes('_4')
    );
    this.showDialogueOptions();
  }

  private createDialoguePanel(width: number, height: number): void {
    const mobile = this.isMobile();
    this.dialogueContainer = this.add.container(width / 2, mobile ? height / 2 + 80 : height / 2 + 70);
  }

  private showDialogueOptions(): void {
    if (!this.dialogueContainer || !this.currentSuspect) return;

    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const panelWidth = width - (mobile ? 16 : 60);
    const panelHeight = height - (mobile ? 270 : 280);

    this.dialogueContainer.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    bg.lineStyle(1, 0x394867, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    this.dialogueContainer.add(bg);

    this.dialogueContainer.add(this.add.text(0, -panelHeight / 2 + 12, 'What to ask?', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(14)}px`, color: '#ffd700',
      resolution: 2,
    }).setOrigin(0.5));

    let yOffset = -panelHeight / 2 + 40;
    const options = this.currentDialogueOptions.length > 0
      ? this.currentDialogueOptions
      : this.currentSuspect.dialogueOptions.slice(0, 3);

    options.forEach((option, idx) => {
      const optionText = this.add
        .text(-panelWidth / 2 + 15, yOffset, `${idx + 1}. ${option.text}`, {
          fontFamily: 'Courier New', fontSize: `${this.getFontSize(14)}px`, color: '#00ccff',
          wordWrap: { width: panelWidth - 30 },
          resolution: 2,
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => optionText.setColor('#ffffff'))
        .on('pointerout', () => optionText.setColor('#00ccff'))
        .on('pointerdown', () => this.selectDialogue(option));
      this.dialogueContainer!.add(optionText);
      yOffset += mobile ? 40 : 45;
    });
  }

  private async selectDialogue(option: DialogueOption): Promise<void> {
    if (!this.dialogueContainer || !this.currentSuspect) return;

    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const panelWidth = width - (mobile ? 16 : 60);
    const panelHeight = height - (mobile ? 270 : 280);

    this.dialogueContainer.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    bg.lineStyle(1, option.isSuspicious ? 0xff4444 : 0x394867, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 6);
    this.dialogueContainer.add(bg);

    // Your question
    this.dialogueContainer.add(this.add.text(-panelWidth / 2 + 12, -panelHeight / 2 + 15, 'YOU:', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#00ff00',
      resolution: 2,
    }));

    this.dialogueContainer.add(this.add.text(-panelWidth / 2 + 12, -panelHeight / 2 + 32, `"${option.text}"`, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(13)}px`, color: '#ffffff',
      fontStyle: 'italic', wordWrap: { width: panelWidth - 24 },
      resolution: 2,
    }));

    // Response
    const responseY = -panelHeight / 2 + (mobile ? 70 : 85);
    this.dialogueContainer.add(this.add.text(-panelWidth / 2 + 12, responseY, `${this.currentSuspect.name}:`, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`,
      color: option.isSuspicious ? '#ff4444' : '#ffff00',
      resolution: 2,
    }));

    this.dialogueContainer.add(this.add.text(-panelWidth / 2 + 12, responseY + 18, `"${option.response}"`, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(13)}px`, color: '#cccccc',
      fontStyle: 'italic', wordWrap: { width: panelWidth - 24 },
      resolution: 2,
    }));

    if (option.isSuspicious) {
      this.dialogueContainer.add(this.add.text(panelWidth / 2 - 15, -panelHeight / 2 + 15, 'SUSPICIOUS', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(11)}px`, color: '#ff4444',
        resolution: 2,
      }).setOrigin(1, 0));
    }

    if (option.unlocksClue) {
      await this.findClue(option.unlocksClue);
    }

    // Continue button
    const continueBtn = this.add
      .text(0, panelHeight / 2 - 25, '[CONTINUE]', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(14)}px`, color: '#00ff00',
        backgroundColor: '#1a1a2e', padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ffff'))
      .on('pointerout', () => continueBtn.setColor('#00ff00'))
      .on('pointerdown', () => {
        if (option.nextOptions && this.currentSuspect) {
          this.currentDialogueOptions = this.currentSuspect.dialogueOptions.filter((opt) =>
            option.nextOptions!.includes(opt.id)
          );
        } else {
          this.currentDialogueOptions = [];
        }
        this.showDialogueOptions();
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
      this.showClueNotification(data.clue.name);
    } catch (error) {
      console.error('Failed to find clue:', error);
      if (this.progress) this.progress.cluesFound.push(clueId);
    }
  }

  private showClueNotification(clueName: string): void {
    const { width } = this.scale;
    const notification = this.add
      .text(width / 2, this.isMobile() ? 38 : 50, `NEW CLUE: ${clueName}`, {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(13)}px`, color: '#ffd700',
        backgroundColor: '#1a1a2e', padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

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
    const btnY = height - (mobile ? 18 : 22);
    const fontSize = this.getFontSize(14);
    const padding = mobile ? { x: 10, y: 6 } : { x: 12, y: 8 };

    const backBtn = this.add
      .text(width / 2 - (mobile ? 70 : 110), btnY, '[SCENE]', {
        fontFamily: 'Courier New', fontSize: `${fontSize}px`, color: '#888888',
        backgroundColor: '#1a1a2e', padding,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#888888'))
      .on('pointerdown', () => transitionToScene(this, 'CrimeScene'));

    const accuseBtn = this.add
      .text(width / 2 + (mobile ? 70 : 110), btnY, '[ACCUSE]', {
        fontFamily: 'Courier New', fontSize: `${fontSize}px`, color: '#ff4444',
        backgroundColor: '#1a1a2e', padding,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => accuseBtn.setColor('#ff8888'))
      .on('pointerout', () => accuseBtn.setColor('#ff4444'))
      .on('pointerdown', () => transitionToScene(this, 'Accusation'));
  }
}
