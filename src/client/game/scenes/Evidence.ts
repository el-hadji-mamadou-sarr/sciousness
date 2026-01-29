import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, Clue } from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen, getScaleFactor } from '../utils/NoirText';
import { GameStateManager } from '../utils/GameStateManager';

export class Evidence extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private scrollContainer: GameObjects.Container | null = null;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private isDragging: boolean = false;
  private lastY: number = 0;
  private returnScene: string = 'Accusation';

  constructor() {
    super('Evidence');
  }

  init(data: { returnTo?: string }) {
    this.returnScene = data?.returnTo || 'Accusation';
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
    this.scrollContainer = null;

    this.cameras.main.setBackgroundColor(0x0a0a14);

    await this.loadGameData();

    this.createHeader(width);
    this.createEvidenceList(width, height);
    this.createBackButton(width, height);

    this.scale.on('resize', () => this.scene.restart());
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

  private createHeader(width: number): void {
    const mobile = this.isMobile();

    createNoirText(this, width / 2, mobile ? 25 : 35, 'EVIDENCE', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    if (!this.currentCase || !this.progress) return;

    const foundClues = this.currentCase.clues.filter((c) => this.progress!.cluesFound.includes(c.id));

    createNoirText(
      this,
      width / 2,
      mobile ? 50 : 65,
      `${foundClues.length} OF ${this.currentCase.clues.length} FOUND`,
      {
        size: 'medium',
        color: 'white',
        origin: { x: 0.5, y: 0.5 },
      }
    );
  }

  private createEvidenceList(width: number, height: number): void {
    if (!this.currentCase || !this.progress) return;

    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const foundClues = this.currentCase.clues.filter((c) => this.progress!.cluesFound.includes(c.id));

    if (foundClues.length === 0) {
      createNoirText(this, width / 2, height / 2, 'NO EVIDENCE YET', {
        size: 'large',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
      createNoirText(this, width / 2, height / 2 + 40, 'EXAMINE THE CRIME SCENE', {
        size: 'medium',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
      return;
    }

    const cardHeight = mobile ? 130 : Math.round(200 * scale);
    const cardSpacing = mobile ? 15 : Math.round(25 * scale);
    const scrollAreaTop = mobile ? 75 : Math.round(120 * scale);
    const scrollAreaBottom = height - (mobile ? 60 : Math.round(90 * scale));
    const scrollAreaHeight = scrollAreaBottom - scrollAreaTop;

    this.scrollContainer = this.add.container(0, scrollAreaTop);

    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, scrollAreaTop, width, scrollAreaHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    foundClues.forEach((clue, index) => {
      const y = index * (cardHeight + cardSpacing);
      const container = this.createEvidenceCard(clue, width, y, cardHeight);
      this.scrollContainer!.add(container);
    });

    const totalContentHeight = foundClues.length * (cardHeight + cardSpacing) - cardSpacing;
    this.maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    if (this.maxScroll > 0) {
      this.setupScrolling(width, scrollAreaTop, scrollAreaHeight);
    }
  }

  private createEvidenceCard(clue: Clue, width: number, y: number, cardHeight: number): GameObjects.Container {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const cardWidth = mobile ? width - 24 : Math.min(width - Math.round(100 * scale), Math.round(900 * scale));
    const container = this.add.container(width / 2, y);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 8);
    bg.lineStyle(3, 0xffd700, 1);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 8);
    container.add(bg);

    // Clue name - use medium size, no scaling
    container.add(
      createNoirText(this, -cardWidth / 2 + 15, 15, clue.name.toUpperCase(), {
        size: 'medium',
        color: 'gold',
        origin: { x: 0, y: 0 },
      })
    );

    // Description - use small size for readability
    container.add(
      createNoirText(this, -cardWidth / 2 + 15, mobile ? 45 : 50, clue.description.toUpperCase(), {
        size: 'small',
        color: 'white',
        origin: { x: 0, y: 0 },
        maxWidth: cardWidth - 30,
      })
    );

    // Linked suspect
    if (clue.linkedTo) {
      const suspect = this.currentCase?.suspects.find((s) => s.id === clue.linkedTo);
      if (suspect) {
        container.add(
          createNoirText(this, -cardWidth / 2 + 15, cardHeight - 25, `LINKS TO: ${suspect.name.toUpperCase()}`, {
            size: 'small',
            color: 'red',
            origin: { x: 0, y: 0 },
          })
        );
      }
    }

    return container;
  }

  private setupScrolling(width: number, scrollAreaTop: number, scrollAreaHeight: number): void {
    const scrollIndicator = this.add.graphics();
    const updateScrollIndicator = () => {
      scrollIndicator.clear();
      if (this.maxScroll <= 0) return;
      const scrollRatio = this.scrollY / this.maxScroll;
      const indicatorHeight = Math.max(40, (scrollAreaHeight / (scrollAreaHeight + this.maxScroll)) * scrollAreaHeight);
      const indicatorY = scrollAreaTop + scrollRatio * (scrollAreaHeight - indicatorHeight);
      scrollIndicator.fillStyle(0xffd700, 0.5);
      scrollIndicator.fillRoundedRect(width - 10, indicatorY, 6, indicatorHeight, 3);
    };
    updateScrollIndicator();

    const hitArea = this.add.rectangle(width / 2, scrollAreaTop + scrollAreaHeight / 2, width, scrollAreaHeight, 0x000000, 0);
    hitArea.setInteractive();

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

    hitArea.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, _dy: number, dz: number) => {
      if (!this.scrollContainer) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dz * 0.5, 0, this.maxScroll);
      this.scrollContainer.y = scrollAreaTop - this.scrollY;
      updateScrollIndicator();
    });
  }

  private createBackButton(width: number, height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const navHeight = mobile ? 55 : Math.round(85 * scale);
    const btnY = height - navHeight / 2;

    // Bottom nav bar background
    const navBg = this.add.graphics();
    navBg.fillStyle(0x0a0a14, 1);
    navBg.fillRect(0, height - navHeight, width, navHeight);
    navBg.lineStyle(2, 0x333333, 1);
    navBg.lineBetween(0, height - navHeight, width, height - navHeight);

    createNoirButton(this, width / 2, btnY, '[BACK]', {
      size: 'medium',
      color: 'gold',
      hoverColor: 'white',
      onClick: () => transitionToScene(this, this.returnScene),
      padding: { x: 20, y: 10 },
    });
  }
}
