import { Scene, GameObjects } from 'phaser';
import { Case, Suspect, PlayerProgress, AccuseResponse } from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { drawSuspectPortrait } from '../utils/ProceduralGraphics';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';
import { GameStateManager } from '../utils/GameStateManager';
import { QuickNotes } from '../utils/QuickNotes';

export class Accusation extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private selectedSuspect: Suspect | null = null;
  private suspectButtons: GameObjects.Container[] = [];
  private confirmPanel: GameObjects.Container | null = null;
  private quickNotes: QuickNotes | null = null;
  private scrollContainer: GameObjects.Container | null = null;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private isDragging: boolean = false;
  private lastY: number = 0;
  private dragStartY: number = 0;
  private hasMoved: boolean = false;

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

    createNoirText(this, width / 2, this.isMobile() ? 38 : 50, 'TAP SUSPECT TO ACCUSE', {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirText(this, width / 2, this.isMobile() ? 54 : 68, 'ONE CHANCE ONLY!', {
      size: 'small',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    await this.loadGameData();

    this.createSuspectSelection(width);
    this.createConfirmPanel(width, height);
    this.createNavigationButtons(width, height);

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

  private createSuspectSelection(width: number): void {
    if (!this.currentCase) return;

    const { height } = this.scale;
    const mobile = this.isMobile();
    const suspects = this.currentCase.suspects;
    const headerHeight = mobile ? 70 : 90;
    const navHeight = mobile ? 50 : 60;
    const cardHeight = mobile ? 120 : 145;
    const cardSpacing = mobile ? 8 : 12;

    // Calculate scroll area dimensions
    const scrollAreaTop = headerHeight;
    const scrollAreaHeight = height - headerHeight - navHeight - 10;

    // Create scroll container
    this.scrollContainer = this.add.container(0, 0);

    // Create suspect cards inside scroll container
    suspects.forEach((suspect, index) => {
      const y = scrollAreaTop + index * (cardHeight + cardSpacing);
      const container = this.createSuspectCard(suspect, width, y, cardHeight);
      this.scrollContainer!.add(container);
      this.suspectButtons.push(container);
    });

    // Calculate max scroll (total content height - visible area)
    const totalContentHeight = suspects.length * (cardHeight + cardSpacing) - cardSpacing;
    this.maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    // Create mask for scroll area
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, scrollAreaTop, width, scrollAreaHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // Add scroll interaction
    this.setupScrollInteraction(scrollAreaTop, scrollAreaHeight, width);
  }

  private setupScrollInteraction(scrollAreaTop: number, scrollAreaHeight: number, width: number): void {
    // Drag scrolling - use scene-level input to track dragging
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only start drag if within scroll area
      if (pointer.y >= scrollAreaTop && pointer.y <= scrollAreaTop + scrollAreaHeight) {
        this.isDragging = true;
        this.lastY = pointer.y;
        this.dragStartY = pointer.y;
        this.hasMoved = false;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.scrollContainer) {
        const deltaY = pointer.y - this.lastY;
        const totalMoved = Math.abs(pointer.y - this.dragStartY);

        // Only scroll if moved more than threshold (to distinguish from tap)
        if (totalMoved > 10) {
          this.hasMoved = true;
          this.scrollY = Phaser.Math.Clamp(this.scrollY - deltaY, 0, this.maxScroll);
          this.scrollContainer.y = -this.scrollY;
        }
        this.lastY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Mouse wheel scrolling
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (this.scrollContainer) {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
        this.scrollContainer.y = -this.scrollY;
      }
    });
  }

  private createSuspectCard(suspect: Suspect, width: number, y: number, cardHeight: number): GameObjects.Container {
    const mobile = this.isMobile();
    // Create container - will be added to scrollContainer, so use scene.add
    const container = this.add.container(width / 2, y);
    const cardWidth = width - (mobile ? 20 : 60);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    bg.lineStyle(2, 0x394867, 1);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    container.add(bg);

    const portraitSize = mobile ? 60 : 75;
    const portrait = this.add.graphics();
    const portraitX = -cardWidth / 2 + 12 + portraitSize / 2;
    const portraitY = 12 + portraitSize / 2;
    drawSuspectPortrait(portrait, portraitX, portraitY, portraitSize, suspect.id, suspect.isGuilty);
    container.add(portrait);

    const textX = -cardWidth / 2 + portraitSize + 25;

    container.add(createNoirText(this, textX, 15, suspect.name.toUpperCase(), {
      size: 'medium',
      color: 'white',
      origin: { x: 0, y: 0 },
    }));

    container.add(createNoirText(this, textX, 42, suspect.description.toUpperCase(), {
      size: 'small',
      color: 'gray',
      origin: { x: 0, y: 0 },
      maxWidth: cardWidth - portraitSize - 40,
    }));

    // Make entire card tappable
    const hitArea = new Phaser.Geom.Rectangle(-cardWidth / 2, 0, cardWidth, cardHeight);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e2a4a, 0.95);
      bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
      bg.lineStyle(2, 0xff4444, 1);
      bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x16213e, 0.9);
      bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
      bg.lineStyle(2, 0x394867, 1);
      bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    });

    container.on('pointerup', () => {
      // Only trigger if we didn't scroll (tap vs drag)
      if (!this.hasMoved) {
        this.showConfirmation(suspect);
      }
    });

    return container;
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
    // Make dim background interactive to block clicks on elements behind
    dimBg.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    dimBg.on('pointerdown', () => {
      // Clicking outside the panel closes it
      this.hideConfirmation();
    });
    this.confirmPanel.add(dimBg);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    bg.lineStyle(3, 0xff4444, 1);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    // Make panel background interactive to prevent clicks from reaching dim background
    bg.setInteractive(new Phaser.Geom.Rectangle(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight), Phaser.Geom.Rectangle.Contains);
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

    // Distribute 2 buttons evenly: at 1/4 and 3/4 of width
    const btnX1 = width / 4;
    const btnX2 = (width * 3) / 4;

    createNoirButton(this, btnX1, btnY, '[BACK]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'white',
      onClick: () => transitionToScene(this, 'CrimeScene'),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });

    createNoirButton(this, btnX2, btnY, '[NOTES]', {
      size: 'small',
      color: 'gold',
      hoverColor: 'white',
      onClick: () => this.quickNotes?.open(),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });
  }
}
