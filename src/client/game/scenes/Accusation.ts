import { Scene, GameObjects } from 'phaser';
import { Case, Suspect, PlayerProgress, InitGameResponse, AccuseResponse } from '../../../shared/types/game';

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

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createScanlines(width, height);

    const mobile = this.isMobile();

    // Title
    this.add.text(width / 2, mobile ? 18 : 28, 'ACCUSATION', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(18)}px`,
      color: '#ff4444', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Warning
    this.add.text(width / 2, mobile ? 38 : 55, 'One chance only!', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(10)}px`, color: '#ffff00',
    }).setOrigin(0.5);

    await this.loadGameData();

    this.createSuspectSelection(width, height);
    this.createConfirmPanel(width, height);
    this.createNavigationButtons(width, height);

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
    this.currentCase = {
      id: 'case_001', title: "The Moderator's Last Ban", dayNumber: 1, intro: '',
      victimName: 'u/ModeratorMax', victimDescription: '', location: 'Home Office',
      crimeSceneObjects: [],
      suspects: [
        { id: 'suspect_banned', name: 'u/BannedForever', description: 'Banned last week.', alibi: 'At a bar.', isGuilty: false, dialogueOptions: [] },
        { id: 'suspect_comod', name: 'u/CoModeratorSam', description: 'Fellow mod.', alibi: 'Asleep.', isGuilty: true, dialogueOptions: [] },
        { id: 'suspect_ex', name: 'u/ExPartner', description: "Victim's ex.", alibi: 'At a movie.', isGuilty: false, dialogueOptions: [] },
      ],
      clues: [],
    };
    this.progress = { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
  }

  private createSuspectSelection(width: number, height: number): void {
    if (!this.currentCase) return;

    const mobile = this.isMobile();
    const suspects = this.currentCase.suspects;
    const startY = mobile ? 60 : 90;
    const cardHeight = mobile ? 70 : 90;
    const cardSpacing = mobile ? 8 : 15;

    suspects.forEach((suspect, index) => {
      const y = startY + index * (cardHeight + cardSpacing);
      const container = this.createSuspectCard(suspect, width, y, cardHeight);
      this.suspectButtons.push(container);
    });

    this.createCluesSummary(width, height);
  }

  private createSuspectCard(suspect: Suspect, width: number, y: number, cardHeight: number): GameObjects.Container {
    const mobile = this.isMobile();
    const container = this.add.container(width / 2, y);
    const cardWidth = width - (mobile ? 20 : 60);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    bg.lineStyle(2, 0x394867, 1);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    container.add(bg);

    // Portrait
    const portraitSize = mobile ? 40 : 55;
    const portrait = this.add.graphics();
    portrait.fillStyle(0x394867, 1);
    portrait.fillRect(-cardWidth / 2 + 8, 8, portraitSize, portraitSize);
    portrait.lineStyle(2, 0x5c6b8a, 1);
    portrait.strokeRect(-cardWidth / 2 + 8, 8, portraitSize, portraitSize);
    portrait.fillStyle(0xcccccc, 1);
    portrait.fillCircle(-cardWidth / 2 + 8 + portraitSize / 2, 8 + portraitSize / 2 - 5, portraitSize / 4);
    portrait.fillStyle(0x222222, 1);
    portrait.fillCircle(-cardWidth / 2 + 8 + portraitSize / 2 - 4, 8 + portraitSize / 2 - 8, 2);
    portrait.fillCircle(-cardWidth / 2 + 8 + portraitSize / 2 + 4, 8 + portraitSize / 2 - 8, 2);
    container.add(portrait);

    const textX = -cardWidth / 2 + portraitSize + 18;

    container.add(this.add.text(textX, 10, suspect.name, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#ffffff',
    }));

    container.add(this.add.text(textX, mobile ? 28 : 32, suspect.description, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(8)}px`, color: '#888888',
      wordWrap: { width: cardWidth - portraitSize - (mobile ? 80 : 100) },
    }));

    // Accuse button
    const accuseBtn = this.add
      .text(cardWidth / 2 - 12, cardHeight / 2, 'ACCUSE', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(10)}px`, color: '#ff4444',
        backgroundColor: '#2a1a1a', padding: { x: 8, y: 5 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        accuseBtn.setColor('#ff8888');
        bg.clear();
        bg.fillStyle(0x1e2a4a, 0.95);
        bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
        bg.lineStyle(2, 0xff4444, 1);
        bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
      })
      .on('pointerout', () => {
        accuseBtn.setColor('#ff4444');
        bg.clear();
        bg.fillStyle(0x16213e, 0.9);
        bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
        bg.lineStyle(2, 0x394867, 1);
        bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
      })
      .on('pointerdown', () => this.showConfirmation(suspect));
    container.add(accuseBtn);

    return container;
  }

  private createCluesSummary(width: number, height: number): void {
    if (!this.currentCase || !this.progress) return;

    const mobile = this.isMobile();
    const panelHeight = mobile ? 60 : 80;
    const panelY = height - panelHeight - (mobile ? 35 : 50);
    const panelWidth = width - (mobile ? 20 : 60);

    const container = this.add.container(width / 2, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f3460, 0.8);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 6);
    bg.lineStyle(1, 0xffd700, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 6);
    container.add(bg);

    container.add(this.add.text(0, 12, `EVIDENCE: ${this.progress.cluesFound.length}/${this.currentCase.clues.length}`, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(10)}px`, color: '#ffd700',
    }).setOrigin(0.5));

    const foundClues = this.currentCase.clues.filter((c) => this.progress!.cluesFound.includes(c.id));
    let clueText = foundClues.length > 0
      ? foundClues.map((c) => `• ${c.name}`).join(mobile ? ', ' : '\n')
      : 'No clues yet!';

    container.add(this.add.text(-panelWidth / 2 + 12, 28, clueText, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(8)}px`, color: '#aaaaaa',
      wordWrap: { width: panelWidth - 24 },
    }));
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
    const mobile = this.isMobile();
    const panelWidth = mobile ? width - 40 : 320;
    const panelHeight = mobile ? 160 : 180;

    // Dim background
    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x000000, 0.7);
    dimBg.fillRect(-width / 2, -height / 2, width, height);
    this.confirmPanel.add(dimBg);

    // Panel
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    bg.lineStyle(3, 0xff4444, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    this.confirmPanel.add(bg);

    this.confirmPanel.add(this.add.text(0, -panelHeight / 2 + 20, 'CONFIRM', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(14)}px`, color: '#ff4444',
    }).setOrigin(0.5));

    this.confirmPanel.add(this.add.text(0, -10, `Accuse ${suspect.name}?`, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#ffffff',
    }).setOrigin(0.5));

    this.confirmPanel.add(this.add.text(0, 15, 'Cannot be undone!', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(9)}px`, color: '#ffff00',
    }).setOrigin(0.5));

    const btnY = panelHeight / 2 - 30;
    const confirmBtn = this.add
      .text(-50, btnY, '[YES]', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#ff4444',
        backgroundColor: '#2a1a1a', padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => confirmBtn.setColor('#ff8888'))
      .on('pointerout', () => confirmBtn.setColor('#ff4444'))
      .on('pointerdown', () => this.makeAccusation());
    this.confirmPanel.add(confirmBtn);

    const cancelBtn = this.add
      .text(50, btnY, '[NO]', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#888888',
        backgroundColor: '#1a1a1a', padding: { x: 10, y: 6 },
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
    if (this.confirmPanel) this.confirmPanel.setVisible(false);
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
    if (this.confirmPanel) this.confirmPanel.setVisible(false);
    this.suspectButtons.forEach((btn) => btn.setVisible(false));

    const { width, height } = this.scale;
    const mobile = this.isMobile();

    this.resultPanel = this.add.container(width / 2, height / 2);

    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = height - (mobile ? 60 : 80);

    const bg = this.add.graphics();
    bg.fillStyle(correct ? 0x0a2a0a : 0x2a0a0a, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 10);
    bg.lineStyle(3, correct ? 0x00ff00 : 0xff0000, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 10);
    this.resultPanel.add(bg);

    const titleText = correct ? 'SOLVED!' : 'WRONG!';
    const titleColor = correct ? '#00ff00' : '#ff0000';
    this.resultPanel.add(this.add.text(0, -panelHeight / 2 + 35, titleText, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(24)}px`,
      color: titleColor, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5));

    let explanation = '';
    if (correct) {
      explanation = `You got ${this.selectedSuspect?.name}!\n\nEvidence:\n• Poison from their garden\n• Mud tracks with their fertilizer\n• Victim exposed their scheme\n\nGreat detective work!`;
    } else {
      explanation = `${this.selectedSuspect?.name} was innocent.\n\nThe killer: u/CoModeratorSam\n\n• Poison from garden plants\n• Unique fertilizer in mud\n• Vote manipulation motive\n\nBetter luck next time!`;
    }

    this.resultPanel.add(this.add.text(0, 10, explanation, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(10)}px`, color: '#cccccc',
      align: 'center', wordWrap: { width: panelWidth - 40 }, lineSpacing: 4,
    }).setOrigin(0.5));

    const playAgainBtn = this.add
      .text(0, panelHeight / 2 - 35, '[MENU]', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(13)}px`, color: '#ffffff',
        backgroundColor: '#333333', padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playAgainBtn.setStyle({ backgroundColor: '#444444' }))
      .on('pointerout', () => playAgainBtn.setStyle({ backgroundColor: '#333333' }))
      .on('pointerdown', () => this.scene.start('MainMenu'));
    this.resultPanel.add(playAgainBtn);
  }

  private createNavigationButtons(_width: number, height: number): void {
    const mobile = this.isMobile();
    const backBtn = this.add
      .text(mobile ? 15 : 25, height - (mobile ? 15 : 22), '[BACK]', {
        fontFamily: 'Courier New', fontSize: `${this.getFontSize(10)}px`, color: '#888888',
        backgroundColor: '#1a1a2e', padding: { x: 8, y: 4 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('Interrogation'));
  }
}
