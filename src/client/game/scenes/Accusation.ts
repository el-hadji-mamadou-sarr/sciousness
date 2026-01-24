import { Scene, GameObjects } from 'phaser';
import { Case, Suspect, PlayerProgress, InitGameResponse, AccuseResponse } from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { drawSuspectPortrait } from '../utils/ProceduralGraphics';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';

export class Accusation extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private selectedSuspect: Suspect | null = null;
  private suspectButtons: GameObjects.Container[] = [];
  private confirmPanel: GameObjects.Container | null = null;

  constructor() {
    super('Accusation');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  async create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createScanlines(width, height);

    createNoirText(this, width / 2, this.isMobile() ? 18 : 28, 'ACCUSATION', {
      size: 'large',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirText(this, width / 2, this.isMobile() ? 42 : 55, 'ONE CHANCE ONLY!', {
      size: 'small',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

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
    this.currentCase = { ...case1 };
    this.progress = { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
  }

  private createSuspectSelection(width: number, height: number): void {
    if (!this.currentCase) return;

    const mobile = this.isMobile();
    const suspects = this.currentCase.suspects;
    const startY = mobile ? 65 : 90;
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

    const portraitSize = mobile ? 40 : 55;
    const portrait = this.add.graphics();
    const portraitX = -cardWidth / 2 + 8 + portraitSize / 2;
    const portraitY = 8 + portraitSize / 2;
    drawSuspectPortrait(portrait, portraitX, portraitY, portraitSize, suspect.id, suspect.isGuilty);
    container.add(portrait);

    const textX = -cardWidth / 2 + portraitSize + 18;

    container.add(createNoirText(this, textX, 12, suspect.name.toUpperCase(), {
      size: 'small',
      color: 'white',
      origin: { x: 0, y: 0 },
    }));

    container.add(createNoirText(this, textX, mobile ? 32 : 38, suspect.description.toUpperCase(), {
      size: 'small',
      color: 'gray',
      origin: { x: 0, y: 0 },
      maxWidth: cardWidth - portraitSize - (mobile ? 90 : 110),
      scale: 0.6,
    }));

    // Accuse button
    const accuseBtn = createNoirButton(this, cardWidth / 2 - 45, cardHeight / 2, 'ACCUSE', {
      size: 'small',
      color: 'red',
      hoverColor: 'gold',
      onClick: () => this.showConfirmation(suspect),
      padding: { x: 10, y: 6 },
    });
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

    container.add(createNoirText(this, 0, 12, `EVIDENCE: ${this.progress.cluesFound.length}/${this.currentCase.clues.length}`, {
      size: 'small',
      color: 'gold',
      origin: { x: 0.5, y: 0 },
    }));

    const foundClues = this.currentCase.clues.filter((c) => this.progress!.cluesFound.includes(c.id));
    let clueText = foundClues.length > 0
      ? foundClues.map((c) => `- ${c.name.toUpperCase()}`).join(mobile ? ', ' : '\n')
      : 'NO CLUES YET!';

    container.add(createNoirText(this, -panelWidth / 2 + 12, 30, clueText, {
      size: 'small',
      color: 'gray',
      origin: { x: 0, y: 0 },
      maxWidth: panelWidth - 24,
      scale: 0.7,
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
    const panelHeight = mobile ? 170 : 190;

    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x000000, 0.7);
    dimBg.fillRect(-width / 2, -height / 2, width, height);
    this.confirmPanel.add(dimBg);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    bg.lineStyle(3, 0xff4444, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    this.confirmPanel.add(bg);

    this.confirmPanel.add(createNoirText(this, 0, -panelHeight / 2 + 25, 'CONFIRM ACCUSATION', {
      size: 'medium',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
    }));

    this.confirmPanel.add(createNoirText(this, 0, -10, `ACCUSE ${suspect.name.toUpperCase()}?`, {
      size: 'small',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    }));

    this.confirmPanel.add(createNoirText(this, 0, 15, 'CANNOT BE UNDONE!', {
      size: 'small',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    }));

    const btnY = panelHeight / 2 - 35;

    this.confirmPanel.add(createNoirButton(this, -55, btnY, '[YES]', {
      size: 'small',
      color: 'red',
      hoverColor: 'gold',
      onClick: () => this.makeAccusation(),
      padding: { x: 15, y: 8 },
    }));

    this.confirmPanel.add(createNoirButton(this, 55, btnY, '[NO]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'white',
      onClick: () => this.hideConfirmation(),
      padding: { x: 15, y: 8 },
    }));

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

  private getGuiltyEvidence(): string[] {
    if (!this.currentCase) return [];

    const guiltySuspect = this.currentCase.suspects.find(s => s.isGuilty);
    if (!guiltySuspect) return [];

    const linkedClues = this.currentCase.clues.filter(c => c.linkedTo === guiltySuspect.id);
    return linkedClues.map(c => c.name);
  }

  private showResult(correct: boolean): void {
    const guiltySuspect = this.currentCase?.suspects.find(s => s.isGuilty);

    transitionToScene(this, 'GameOver', {
      correct,
      accusedName: this.selectedSuspect?.name ?? 'Unknown',
      guiltyName: guiltySuspect?.name ?? 'Unknown',
      evidence: this.getGuiltyEvidence(),
      currentCase: this.currentCase,
      progress: this.progress,
    });
  }

  private createNavigationButtons(_width: number, height: number): void {
    const mobile = this.isMobile();

    createNoirButton(this, mobile ? 50 : 70, height - (mobile ? 20 : 28), '[BACK]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'white',
      onClick: () => transitionToScene(this, 'Interrogation'),
      padding: { x: 12, y: 6 },
    });
  }
}
