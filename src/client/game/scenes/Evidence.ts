import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, Clue } from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';
import { GameStateManager } from '../utils/GameStateManager';

export class Evidence extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private clueContainers: GameObjects.Container[] = [];
  private scrollContainer: GameObjects.Container | null = null;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private isDragging: boolean = false;
  private lastY: number = 0;

  constructor() {
    super('Evidence');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  async create() {
    const { width, height } = this.scale;

    // Reset scroll state
    this.scrollY = 0;
    this.maxScroll = 0;
    this.isDragging = false;
    this.clueContainers = [];
    this.scrollContainer = null;

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createScanlines(width, height);

    createNoirText(this, width / 2, this.isMobile() ? 18 : 28, 'EVIDENCE ROOM', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    await this.loadGameData();

    this.createEvidenceList(width, height);
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

  private createEvidenceList(width: number, height: number): void {
    if (!this.currentCase || !this.progress) return;

    const mobile = this.isMobile();
    const foundClues = this.currentCase.clues.filter((c) => this.progress!.cluesFound.includes(c.id));

    // Summary header
    const summaryY = mobile ? 45 : 55;
    createNoirText(
      this,
      width / 2,
      summaryY,
      `COLLECTED: ${this.progress.cluesFound.length}/${this.currentCase.clues.length}`,
      {
        size: 'medium',
        color: 'white',
        origin: { x: 0.5, y: 0.5 },
      }
    );

    if (foundClues.length === 0) {
      createNoirText(this, width / 2, height / 2, 'NO EVIDENCE COLLECTED YET!', {
        size: 'medium',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
      return;
    }

    const cardHeight = mobile ? 100 : 110;
    const cardSpacing = mobile ? 10 : 12;
    const scrollAreaTop = mobile ? 75 : 90;
    const scrollAreaBottom = height - (mobile ? 50 : 70);
    const scrollAreaHeight = scrollAreaBottom - scrollAreaTop;

    // Create scroll container
    this.scrollContainer = this.add.container(0, scrollAreaTop);

    // Create mask for scroll area
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, scrollAreaTop, width, scrollAreaHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // Add evidence cards to scroll container
    foundClues.forEach((clue, index) => {
      const y = index * (cardHeight + cardSpacing);
      const container = this.createEvidenceCard(clue, width, y, cardHeight);
      this.scrollContainer!.add(container);
      this.clueContainers.push(container);
    });

    // Calculate total content height and max scroll
    const totalContentHeight = foundClues.length * (cardHeight + cardSpacing) - cardSpacing;
    this.maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    // Only setup scrolling if content overflows
    if (this.maxScroll > 0) {
      this.setupScrolling(width, scrollAreaTop, scrollAreaHeight);
    }
  }

  private setupScrolling(width: number, scrollAreaTop: number, scrollAreaHeight: number): void {
    // Create scroll indicator
    const scrollIndicator = this.add.graphics();
    const updateScrollIndicator = () => {
      scrollIndicator.clear();
      if (this.maxScroll <= 0) return;
      const scrollRatio = this.scrollY / this.maxScroll;
      const indicatorHeight = Math.max(30, (scrollAreaHeight / (scrollAreaHeight + this.maxScroll)) * scrollAreaHeight);
      const indicatorY = scrollAreaTop + scrollRatio * (scrollAreaHeight - indicatorHeight);
      scrollIndicator.fillStyle(0xffd700, 0.4);
      scrollIndicator.fillRoundedRect(width - 8, indicatorY, 4, indicatorHeight, 2);
    };
    updateScrollIndicator();

    // Create invisible hit area for scroll interaction
    const hitArea = this.add.rectangle(width / 2, scrollAreaTop + scrollAreaHeight / 2, width, scrollAreaHeight, 0x000000, 0);
    hitArea.setInteractive();

    // Drag scrolling
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.lastY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.scrollContainer) return;
      const deltaY = this.lastY - pointer.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScroll);
      this.scrollContainer.y = scrollAreaTop - this.scrollY;
      this.lastY = pointer.y;
      updateScrollIndicator();
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Mouse wheel scrolling
    hitArea.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, _dy: number, dz: number) => {
      if (!this.scrollContainer) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dz * 0.5, 0, this.maxScroll);
      this.scrollContainer.y = scrollAreaTop - this.scrollY;
      updateScrollIndicator();
    });
  }

  private createEvidenceCard(clue: Clue, width: number, y: number, cardHeight: number): GameObjects.Container {
    const mobile = this.isMobile();
    const cardWidth = width - (mobile ? 20 : 60);
    const container = this.add.container(width / 2, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    bg.lineStyle(2, 0xffd700, 0.8);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    container.add(bg);

    // Clue name
    container.add(
      createNoirText(this, -cardWidth / 2 + 12, 12, clue.name.toUpperCase(), {
        size: 'medium',
        color: 'gold',
        origin: { x: 0, y: 0 },
      })
    );

    // Clue description
    container.add(
      createNoirText(this, -cardWidth / 2 + 12, 38, clue.description.toUpperCase(), {
        size: 'small',
        color: 'gray',
        origin: { x: 0, y: 0 },
        maxWidth: cardWidth - 24,
      })
    );

    // Linked suspect indicator
    if (clue.linkedTo) {
      const suspect = this.currentCase?.suspects.find((s) => s.id === clue.linkedTo);
      if (suspect) {
        container.add(
          createNoirText(this, cardWidth / 2 - 12, cardHeight - 18, `[LINKS TO: ${suspect.name.toUpperCase()}]`, {
            size: 'small',
            color: 'red',
            origin: { x: 1, y: 0 },
          })
        );
      }
    }

    return container;
  }

  private createNavigationButtons(_width: number, height: number): void {
    const mobile = this.isMobile();

    createNoirButton(this, mobile ? 50 : 70, height - (mobile ? 20 : 28), '[BACK]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'white',
      onClick: () => transitionToScene(this, 'Accusation'),
      padding: { x: 12, y: 6 },
    });
  }
}
