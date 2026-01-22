import { Scene, GameObjects } from 'phaser';
import {
  Case,
  Suspect,
  DialogueOption,
  PlayerProgress,
  InitGameResponse,
  FindClueResponse,
} from '../../../shared/types/game';

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

  async create() {
    const { width, height } = this.scale;

    // Dark interrogation room background
    this.cameras.main.setBackgroundColor(0x0f0f1a);

    // Create scanline effect
    this.createScanlines(width, height);

    // Title
    this.add
      .text(width / 2, 25, 'INTERROGATION ROOM', {
        fontFamily: 'Courier New',
        fontSize: '22px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Load game data
    await this.loadGameData();

    // Create UI elements
    this.createSuspectPanel(width, height);
    this.createDialoguePanel(width, height);
    this.createNavigationButtons(width, height);

    // Show first suspect
    this.showSuspect(0);
  }

  private createScanlines(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x000000, 0.15);
    for (let y = 0; y < height; y += 3) {
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
    this.currentCase = {
      id: 'case_001',
      title: "The Moderator's Last Ban",
      dayNumber: 1,
      intro: '',
      victimName: 'u/ModeratorMax',
      victimDescription: '',
      location: 'Home Office',
      crimeSceneObjects: [],
      suspects: [
        {
          id: 'suspect_banned',
          name: 'u/BannedForever',
          description: 'A user who was permanently banned last week.',
          alibi: 'Claims to have been at a bar.',
          isGuilty: false,
          dialogueOptions: [
            {
              id: 'banned_1',
              text: 'Where were you last night?',
              response: "I was at O'Malley's Bar until midnight.",
              nextOptions: ['banned_2'],
            },
            {
              id: 'banned_2',
              text: 'You sent threatening messages. Why?',
              response: "I was angry about the ban. But I didn't kill anyone!",
              unlocksClue: 'clue_threats',
            },
          ],
        },
        {
          id: 'suspect_comod',
          name: 'u/CoModeratorSam',
          description: 'Fellow moderator with a recent disagreement.',
          alibi: 'Says they were asleep at home.',
          isGuilty: true,
          dialogueOptions: [
            {
              id: 'comod_1',
              text: 'Where were you last night?',
              response: 'I was home, asleep by 10 PM.',
              isSuspicious: true,
              nextOptions: ['comod_2'],
            },
            {
              id: 'comod_2',
              text: 'Do you own any gardening supplies?',
              response: 'I... yes, I have a garden. Why?',
              isSuspicious: true,
              unlocksClue: 'clue_garden',
            },
          ],
        },
        {
          id: 'suspect_ex',
          name: 'u/ExPartner_2019',
          description: "The victim's ex-partner.",
          alibi: 'Was at a movie theater.',
          isGuilty: false,
          dialogueOptions: [
            {
              id: 'ex_1',
              text: 'Where were you last night?',
              response: 'At the Cineplex watching a movie. I have the ticket stub.',
              nextOptions: ['ex_2'],
            },
            {
              id: 'ex_2',
              text: 'Why did you reconnect with the victim?',
              response: 'Max reached out wanting to talk about something important.',
              unlocksClue: 'clue_meeting',
            },
          ],
        },
      ],
      clues: [],
    };
    this.progress = {
      odayNumber: 1,
      cluesFound: [],
      suspectsInterrogated: [],
      solved: false,
      correct: false,
    };
  }

  private createSuspectPanel(width: number, _height: number): void {
    this.suspectPanel = this.add.container(width / 2, 150);

    // Will be populated when showing a suspect
  }

  private showSuspect(index: number): void {
    if (!this.currentCase || !this.suspectPanel) return;

    const suspects = this.currentCase.suspects;
    if (index < 0 || index >= suspects.length) return;

    const suspect = suspects[index];
    if (!suspect) return;

    this.currentSuspect = suspect;

    // Clear panel
    this.suspectPanel.removeAll(true);

    const { width } = this.scale;
    const panelWidth = width - 60;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, -60, panelWidth, 120, 8);
    bg.lineStyle(2, 0xff4444, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, -60, panelWidth, 120, 8);
    this.suspectPanel.add(bg);

    // Suspect portrait placeholder (pixel art style)
    const portrait = this.add.graphics();
    portrait.fillStyle(0x394867, 1);
    portrait.fillRect(-panelWidth / 2 + 15, -45, 70, 90);
    portrait.lineStyle(2, 0x5c6b8a, 1);
    portrait.strokeRect(-panelWidth / 2 + 15, -45, 70, 90);
    // Simple face
    portrait.fillStyle(0xdddddd, 1);
    portrait.fillCircle(-panelWidth / 2 + 50, -15, 20); // head
    portrait.fillStyle(0x333333, 1);
    portrait.fillCircle(-panelWidth / 2 + 43, -20, 3); // left eye
    portrait.fillCircle(-panelWidth / 2 + 57, -20, 3); // right eye
    this.suspectPanel.add(portrait);

    // Suspect name
    const nameText = this.add
      .text(-panelWidth / 2 + 100, -45, suspect.name, {
        fontFamily: 'Courier New',
        fontSize: '20px',
        color: '#ffffff',
      });
    this.suspectPanel.add(nameText);

    // Description
    const descText = this.add
      .text(-panelWidth / 2 + 100, -20, suspect.description, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#888888',
        wordWrap: { width: panelWidth - 140 },
      });
    this.suspectPanel.add(descText);

    // Alibi
    const alibiLabel = this.add
      .text(-panelWidth / 2 + 100, 15, 'ALIBI:', {
        fontFamily: 'Courier New',
        fontSize: '11px',
        color: '#ff4444',
      });
    this.suspectPanel.add(alibiLabel);

    const alibiText = this.add
      .text(-panelWidth / 2 + 150, 15, suspect.alibi, {
        fontFamily: 'Courier New',
        fontSize: '11px',
        color: '#cccccc',
        wordWrap: { width: panelWidth - 180 },
      });
    this.suspectPanel.add(alibiText);

    // Suspect navigation
    const prevBtn = this.add
      .text(-panelWidth / 2 + 20, 50, '< PREV', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: index > 0 ? '#00ff00' : '#333333',
      })
      .setInteractive({ useHandCursor: index > 0 })
      .on('pointerdown', () => {
        if (index > 0) this.showSuspect(index - 1);
      });
    this.suspectPanel.add(prevBtn);

    const suspectCounter = this.add
      .text(0, 50, `${index + 1} / ${suspects.length}`, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#666666',
      })
      .setOrigin(0.5);
    this.suspectPanel.add(suspectCounter);

    const nextBtn = this.add
      .text(panelWidth / 2 - 20, 50, 'NEXT >', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: index < suspects.length - 1 ? '#00ff00' : '#333333',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: index < suspects.length - 1 })
      .on('pointerdown', () => {
        if (index < suspects.length - 1) this.showSuspect(index + 1);
      });
    this.suspectPanel.add(nextBtn);

    // Reset dialogue to initial options
    this.currentDialogueOptions = suspect.dialogueOptions.filter(
      (opt) => !opt.id.includes('_2') && !opt.id.includes('_3') && !opt.id.includes('_4')
    );
    this.showDialogueOptions();
  }

  private createDialoguePanel(width: number, height: number): void {
    this.dialogueContainer = this.add.container(width / 2, height / 2 + 80);
  }

  private showDialogueOptions(): void {
    if (!this.dialogueContainer || !this.currentSuspect) return;

    const { width, height } = this.scale;
    const panelWidth = width - 60;

    // Clear existing options
    this.dialogueContainer.removeAll(true);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, -100, panelWidth, height - 340, 8);
    bg.lineStyle(1, 0x394867, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -100, panelWidth, height - 340, 8);
    this.dialogueContainer.add(bg);

    // Title
    const title = this.add
      .text(0, -80, 'What would you like to ask?', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#ffd700',
      })
      .setOrigin(0.5);
    this.dialogueContainer.add(title);

    // Dialogue options
    let yOffset = -50;
    const options =
      this.currentDialogueOptions.length > 0
        ? this.currentDialogueOptions
        : this.currentSuspect.dialogueOptions.slice(0, 3);

    options.forEach((option, index) => {
      const optionText = this.add
        .text(-panelWidth / 2 + 20, yOffset, `${index + 1}. ${option.text}`, {
          fontFamily: 'Courier New',
          fontSize: '13px',
          color: '#00ccff',
          wordWrap: { width: panelWidth - 40 },
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => optionText.setColor('#ffffff'))
        .on('pointerout', () => optionText.setColor('#00ccff'))
        .on('pointerdown', () => this.selectDialogue(option));

      this.dialogueContainer!.add(optionText);
      yOffset += 35;
    });
  }

  private async selectDialogue(option: DialogueOption): Promise<void> {
    if (!this.dialogueContainer || !this.currentSuspect) return;

    const { width, height } = this.scale;
    const panelWidth = width - 60;

    // Clear options
    this.dialogueContainer.removeAll(true);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, -100, panelWidth, height - 340, 8);
    bg.lineStyle(1, option.isSuspicious ? 0xff4444 : 0x394867, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -100, panelWidth, height - 340, 8);
    this.dialogueContainer.add(bg);

    // Your question
    const questionLabel = this.add
      .text(-panelWidth / 2 + 20, -80, 'YOU:', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#00ff00',
      });
    this.dialogueContainer.add(questionLabel);

    const questionText = this.add
      .text(-panelWidth / 2 + 20, -60, `"${option.text}"`, {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'italic',
        wordWrap: { width: panelWidth - 40 },
      });
    this.dialogueContainer.add(questionText);

    // Suspect response
    const responseLabel = this.add
      .text(-panelWidth / 2 + 20, -20, `${this.currentSuspect.name}:`, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: option.isSuspicious ? '#ff4444' : '#ffff00',
      });
    this.dialogueContainer.add(responseLabel);

    const responseText = this.add
      .text(-panelWidth / 2 + 20, 0, `"${option.response}"`, {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#cccccc',
        fontStyle: 'italic',
        wordWrap: { width: panelWidth - 40 },
      });
    this.dialogueContainer.add(responseText);

    // Suspicious indicator
    if (option.isSuspicious) {
      const suspiciousText = this.add
        .text(panelWidth / 2 - 30, -80, '⚠ SUSPICIOUS', {
          fontFamily: 'Courier New',
          fontSize: '11px',
          color: '#ff4444',
        })
        .setOrigin(1, 0);
      this.dialogueContainer.add(suspiciousText);
    }

    // If this unlocks a clue
    if (option.unlocksClue) {
      await this.findClue(option.unlocksClue);
    }

    // Continue button
    const continueBtn = this.add
      .text(0, height - 380, '[ CONTINUE INTERROGATION ]', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#00ff00',
        backgroundColor: '#1a1a2e',
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ffff'))
      .on('pointerout', () => continueBtn.setColor('#00ff00'))
      .on('pointerdown', () => {
        // Update available options based on nextOptions
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

      // Show clue notification
      this.showClueNotification(data.clue.name);
    } catch (error) {
      console.error('Failed to find clue:', error);
      if (this.progress) {
        this.progress.cluesFound.push(clueId);
      }
    }
  }

  private showClueNotification(clueName: string): void {
    const { width } = this.scale;

    const notification = this.add
      .text(width / 2, 60, `🔍 NEW CLUE: ${clueName}`, {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#ffd700',
        backgroundColor: '#1a1a2e',
        padding: { x: 15, y: 8 },
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
    // Back to crime scene
    const backBtn = this.add
      .text(width / 2 - 120, height - 25, '[ CRIME SCENE ]', {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#888888',
        backgroundColor: '#1a1a2e',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('CrimeScene'));

    // Accuse button
    const accuseBtn = this.add
      .text(width / 2 + 120, height - 25, '[ MAKE ACCUSATION ]', {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#ff4444',
        backgroundColor: '#1a1a2e',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => accuseBtn.setColor('#ff8888'))
      .on('pointerout', () => accuseBtn.setColor('#ff4444'))
      .on('pointerdown', () => this.scene.start('Accusation'));
  }
}
