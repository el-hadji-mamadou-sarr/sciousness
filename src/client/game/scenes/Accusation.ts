import { Scene, GameObjects } from 'phaser';
import {
  Case,
  Suspect,
  PlayerProgress,
  InitGameResponse,
  AccuseResponse,
} from '../../../shared/types/game';

export class Accusation extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private selectedSuspect: Suspect | null = null;
  private suspectButtons: GameObjects.Container[] = [];
  private confirmPanel: GameObjects.Container | null = null;
  private resultPanel: GameObjects.Container | null = null;

  constructor() {
    super('Accusation');
  }

  async create() {
    const { width, height } = this.scale;

    // Dark courtroom-style background
    this.cameras.main.setBackgroundColor(0x0a0a14);

    // Create scanline effect
    this.createScanlines(width, height);

    // Title
    this.add
      .text(width / 2, 30, 'MAKE YOUR ACCUSATION', {
        fontFamily: 'Courier New',
        fontSize: '24px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Warning text
    this.add
      .text(width / 2, 60, 'Choose carefully - you only get one chance!', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#ffff00',
      })
      .setOrigin(0.5);

    // Load game data
    await this.loadGameData();

    // Create suspect selection
    this.createSuspectSelection(width, height);

    // Create confirmation panel (hidden initially)
    this.createConfirmPanel(width, height);

    // Create navigation
    this.createNavigationButtons(width, height);
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
          dialogueOptions: [],
        },
        {
          id: 'suspect_comod',
          name: 'u/CoModeratorSam',
          description: 'Fellow moderator with a recent disagreement.',
          alibi: 'Says they were asleep at home.',
          isGuilty: true,
          dialogueOptions: [],
        },
        {
          id: 'suspect_ex',
          name: 'u/ExPartner_2019',
          description: "The victim's ex-partner.",
          alibi: 'Was at a movie theater.',
          isGuilty: false,
          dialogueOptions: [],
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

  private createSuspectSelection(width: number, height: number): void {
    if (!this.currentCase) return;

    const suspects = this.currentCase.suspects;
    const startY = 120;
    const cardHeight = 100;
    const cardSpacing = 20;

    suspects.forEach((suspect, index) => {
      const y = startY + index * (cardHeight + cardSpacing);
      const container = this.createSuspectCard(suspect, width, y, cardHeight);
      this.suspectButtons.push(container);
    });

    // Clues summary
    this.createCluesSummary(width, height);
  }

  private createSuspectCard(
    suspect: Suspect,
    width: number,
    y: number,
    height: number
  ): GameObjects.Container {
    const container = this.add.container(width / 2, y);
    const cardWidth = width - 60;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, height, 8);
    bg.lineStyle(2, 0x394867, 1);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, height, 8);
    container.add(bg);

    // Portrait placeholder
    const portrait = this.add.graphics();
    portrait.fillStyle(0x394867, 1);
    portrait.fillRect(-cardWidth / 2 + 15, 10, 60, 80);
    portrait.lineStyle(2, 0x5c6b8a, 1);
    portrait.strokeRect(-cardWidth / 2 + 15, 10, 60, 80);
    // Simple pixel face
    portrait.fillStyle(0xcccccc, 1);
    portrait.fillCircle(-cardWidth / 2 + 45, 40, 18);
    portrait.fillStyle(0x222222, 1);
    portrait.fillCircle(-cardWidth / 2 + 40, 35, 3);
    portrait.fillCircle(-cardWidth / 2 + 50, 35, 3);
    container.add(portrait);

    // Name
    const nameText = this.add
      .text(-cardWidth / 2 + 90, 15, suspect.name, {
        fontFamily: 'Courier New',
        fontSize: '18px',
        color: '#ffffff',
      });
    container.add(nameText);

    // Description
    const descText = this.add
      .text(-cardWidth / 2 + 90, 40, suspect.description, {
        fontFamily: 'Courier New',
        fontSize: '11px',
        color: '#888888',
        wordWrap: { width: cardWidth - 180 },
      });
    container.add(descText);

    // Accuse button
    const accuseBtn = this.add
      .text(cardWidth / 2 - 25, height / 2, 'ACCUSE', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#ff4444',
        backgroundColor: '#2a1a1a',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        accuseBtn.setColor('#ff8888');
        bg.clear();
        bg.fillStyle(0x1e2a4a, 0.95);
        bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, height, 8);
        bg.lineStyle(2, 0xff4444, 1);
        bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, height, 8);
      })
      .on('pointerout', () => {
        accuseBtn.setColor('#ff4444');
        bg.clear();
        bg.fillStyle(0x16213e, 0.9);
        bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, height, 8);
        bg.lineStyle(2, 0x394867, 1);
        bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, height, 8);
      })
      .on('pointerdown', () => this.showConfirmation(suspect));
    container.add(accuseBtn);

    return container;
  }

  private createCluesSummary(width: number, height: number): void {
    if (!this.currentCase || !this.progress) return;

    const panelY = height - 150;
    const panelHeight = 100;
    const panelWidth = width - 60;

    const container = this.add.container(width / 2, panelY);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f3460, 0.8);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    bg.lineStyle(1, 0xffd700, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    container.add(bg);

    // Title
    const title = this.add
      .text(0, 15, `EVIDENCE COLLECTED: ${this.progress.cluesFound.length} / ${this.currentCase.clues.length}`, {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#ffd700',
      })
      .setOrigin(0.5);
    container.add(title);

    // List found clues
    const foundClues = this.currentCase.clues.filter((c) =>
      this.progress!.cluesFound.includes(c.id)
    );

    let clueText = foundClues.map((c) => `• ${c.name}`).join('\n');
    if (clueText.length === 0) {
      clueText = 'No clues found yet. Investigate the crime scene!';
    }

    const cluesList = this.add
      .text(-panelWidth / 2 + 20, 35, clueText, {
        fontFamily: 'Courier New',
        fontSize: '11px',
        color: '#aaaaaa',
        wordWrap: { width: panelWidth - 40 },
      });
    container.add(cluesList);
  }

  private createConfirmPanel(width: number, height: number): void {
    this.confirmPanel = this.add.container(width / 2, height / 2);
    this.confirmPanel.setVisible(false);
    this.confirmPanel.setDepth(100);
  }

  private showConfirmation(suspect: Suspect): void {
    if (!this.confirmPanel) return;

    this.selectedSuspect = suspect;
    this.confirmPanel.removeAll(true);

    const { width, height } = this.scale;
    const panelWidth = 350;
    const panelHeight = 200;

    // Dim background
    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x000000, 0.7);
    dimBg.fillRect(-width / 2, -height / 2, width, height);
    this.confirmPanel.add(dimBg);

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 10);
    bg.lineStyle(3, 0xff4444, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 10);
    this.confirmPanel.add(bg);

    // Title
    const title = this.add
      .text(0, -panelHeight / 2 + 25, 'CONFIRM ACCUSATION', {
        fontFamily: 'Courier New',
        fontSize: '18px',
        color: '#ff4444',
      })
      .setOrigin(0.5);
    this.confirmPanel.add(title);

    // Suspect name
    const suspectText = this.add
      .text(0, -20, `Accuse ${suspect.name}?`, {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.confirmPanel.add(suspectText);

    // Warning
    const warning = this.add
      .text(0, 15, 'This action cannot be undone!', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#ffff00',
      })
      .setOrigin(0.5);
    this.confirmPanel.add(warning);

    // Confirm button
    const confirmBtn = this.add
      .text(-60, panelHeight / 2 - 40, '[ CONFIRM ]', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#ff4444',
        backgroundColor: '#2a1a1a',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => confirmBtn.setColor('#ff8888'))
      .on('pointerout', () => confirmBtn.setColor('#ff4444'))
      .on('pointerdown', () => this.makeAccusation());
    this.confirmPanel.add(confirmBtn);

    // Cancel button
    const cancelBtn = this.add
      .text(60, panelHeight / 2 - 40, '[ CANCEL ]', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#888888',
        backgroundColor: '#1a1a1a',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => cancelBtn.setColor('#ffffff'))
      .on('pointerout', () => cancelBtn.setColor('#888888'))
      .on('pointerdown', () => this.hideConfirmation());
    this.confirmPanel.add(cancelBtn);

    this.confirmPanel.setVisible(true);
  }

  private hideConfirmation(): void {
    if (this.confirmPanel) {
      this.confirmPanel.setVisible(false);
    }
    this.selectedSuspect = null;
  }

  private async makeAccusation(): Promise<void> {
    if (!this.selectedSuspect) return;

    let isCorrect = this.selectedSuspect.isGuilty;

    try {
      const response = await fetch('/api/game/accuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectId: this.selectedSuspect.id }),
      });

      if (response.ok) {
        const data = (await response.json()) as AccuseResponse;
        isCorrect = data.correct;
        this.progress = data.progress;
      }
    } catch (error) {
      console.error('Failed to make accusation:', error);
    }

    this.showResult(isCorrect);
  }

  private showResult(correct: boolean): void {
    // Hide confirmation panel
    if (this.confirmPanel) {
      this.confirmPanel.setVisible(false);
    }

    // Hide suspect cards
    this.suspectButtons.forEach((btn) => btn.setVisible(false));

    const { width, height } = this.scale;

    this.resultPanel = this.add.container(width / 2, height / 2);

    const panelWidth = width - 80;
    const panelHeight = height - 100;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(correct ? 0x0a2a0a : 0x2a0a0a, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
    bg.lineStyle(4, correct ? 0x00ff00 : 0xff0000, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
    this.resultPanel.add(bg);

    // Result title
    const titleText = correct ? 'CASE SOLVED!' : 'WRONG ACCUSATION';
    const titleColor = correct ? '#00ff00' : '#ff0000';
    const title = this.add
      .text(0, -panelHeight / 2 + 50, titleText, {
        fontFamily: 'Courier New',
        fontSize: '32px',
        color: titleColor,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.resultPanel.add(title);

    // Explanation
    let explanation = '';
    if (correct) {
      explanation = `Congratulations, Detective!\n\nYou correctly identified ${this.selectedSuspect?.name} as the killer.\n\nThe evidence pointed to them:\n• The poison matched plants from their garden\n• The mud tracks contained their fertilizer\n• The victim was about to expose their vote manipulation\n\nTheir "perfect alibi" of being asleep at home was a lie.\nThey had motive, means, and opportunity.`;
    } else {
      explanation = `Case Failed!\n\n${this.selectedSuspect?.name} was innocent.\n\nThe real killer was u/CoModeratorSam.\n\nYou missed crucial evidence:\n• The poison came from plants in their garden\n• Mud tracks contained fertilizer only they used\n• The victim discovered their vote manipulation scheme\n\nBetter luck next time, Detective.`;
    }

    const explanationText = this.add
      .text(0, 20, explanation, {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: panelWidth - 60 },
        lineSpacing: 5,
      })
      .setOrigin(0.5);
    this.resultPanel.add(explanationText);

    // Play again button
    const playAgainBtn = this.add
      .text(0, panelHeight / 2 - 50, '[ RETURN TO MENU ]', {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playAgainBtn.setBackgroundColor('#444444'))
      .on('pointerout', () => playAgainBtn.setBackgroundColor('#333333'))
      .on('pointerdown', () => this.scene.start('MainMenu'));
    this.resultPanel.add(playAgainBtn);
  }

  private createNavigationButtons(_width: number, height: number): void {
    // Back button
    const backBtn = this.add
      .text(30, height - 25, '[ BACK ]', {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#888888',
        backgroundColor: '#1a1a2e',
        padding: { x: 12, y: 6 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('Interrogation'));
  }
}
