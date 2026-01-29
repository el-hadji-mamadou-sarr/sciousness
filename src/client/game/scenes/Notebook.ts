import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, Clue, Suspect } from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';
import { GameStateManager } from '../utils/GameStateManager';

type TabType = 'clues' | 'suspects' | 'links';

export class Notebook extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private activeTab: TabType = 'clues';
  private returnScene: string = 'CrimeScene';
  private scrollContainer: GameObjects.Container | null = null;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private isDragging: boolean = false;
  private lastY: number = 0;
  private tabButtons: GameObjects.Container[] = [];

  constructor() {
    super('Notebook');
  }

  init(data: { returnTo?: string }) {
    this.returnScene = data?.returnTo || 'CrimeScene';
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  async create() {
    const { width, height } = this.scale;

    // Reset state
    this.scrollY = 0;
    this.maxScroll = 0;
    this.isDragging = false;
    this.scrollContainer = null;
    this.tabButtons = [];

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createScanlines(width, height);

    createNoirText(this, width / 2, this.isMobile() ? 18 : 28, 'DETECTIVE NOTEBOOK', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    });

    await this.loadGameData();

    this.createTabs(width);
    this.createContentArea(width, height);
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

  private createTabs(width: number): void {
    const mobile = this.isMobile();
    const tabY = mobile ? 50 : 65;
    const tabs: { id: TabType; label: string }[] = [
      { id: 'clues', label: 'CLUES' },
      { id: 'suspects', label: 'SUSPECTS' },
      { id: 'links', label: 'LINKS' },
    ];
    const tabWidth = mobile ? 85 : 110;
    const spacing = mobile ? 8 : 15;
    const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + tabWidth / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + spacing);
      const isActive = this.activeTab === tab.id;

      const btn = createNoirButton(this, x, tabY, `[${tab.label}]`, {
        size: 'small',
        color: isActive ? 'gold' : 'gray',
        hoverColor: 'white',
        onClick: () => this.switchTab(tab.id),
        padding: { x: 8, y: 6 },
      });
      this.tabButtons.push(btn);
    });
  }

  private switchTab(tab: TabType): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.scene.restart({ returnTo: this.returnScene });
  }

  private createContentArea(width: number, height: number): void {
    switch (this.activeTab) {
      case 'clues':
        this.renderCluesTab(width, height);
        break;
      case 'suspects':
        this.renderSuspectsTab(width, height);
        break;
      case 'links':
        this.renderLinksTab(width, height);
        break;
    }
  }

  private renderCluesTab(width: number, height: number): void {
    if (!this.currentCase || !this.progress) return;

    const mobile = this.isMobile();
    const foundClues = this.currentCase.clues.filter((c) => this.progress!.cluesFound.includes(c.id));

    // Summary header
    const summaryY = mobile ? 75 : 90;
    createNoirText(
      this,
      width / 2,
      summaryY,
      `EVIDENCE COLLECTED: ${foundClues.length}/${this.currentCase.clues.length}`,
      {
        size: 'small',
        color: 'white',
        origin: { x: 0.5, y: 0.5 },
      }
    );

    if (foundClues.length === 0) {
      createNoirText(this, width / 2, height / 2, 'NO CLUES FOUND YET!', {
        size: 'medium',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
      createNoirText(this, width / 2, height / 2 + 30, 'EXAMINE THE CRIME SCENE', {
        size: 'small',
        color: 'darkGray',
        origin: { x: 0.5, y: 0.5 },
      });
      return;
    }

    const cardHeight = mobile ? 100 : 110;
    const cardSpacing = mobile ? 10 : 12;
    const scrollAreaTop = mobile ? 100 : 115;
    const scrollAreaBottom = height - (mobile ? 50 : 70);
    const scrollAreaHeight = scrollAreaBottom - scrollAreaTop;

    this.scrollContainer = this.add.container(0, scrollAreaTop);

    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, scrollAreaTop, width, scrollAreaHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    foundClues.forEach((clue, index) => {
      const y = index * (cardHeight + cardSpacing);
      const container = this.createClueCard(clue, width, y, cardHeight);
      this.scrollContainer!.add(container);
    });

    const totalContentHeight = foundClues.length * (cardHeight + cardSpacing) - cardSpacing;
    this.maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    if (this.maxScroll > 0) {
      this.setupScrolling(width, scrollAreaTop, scrollAreaHeight);
    }
  }

  private createClueCard(clue: Clue, width: number, y: number, cardHeight: number): GameObjects.Container {
    const mobile = this.isMobile();
    const cardWidth = width - (mobile ? 20 : 60);
    const container = this.add.container(width / 2, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    bg.lineStyle(2, 0xffd700, 0.8);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    container.add(bg);

    // Truncate name if too long
    const maxNameLen = mobile ? 20 : 35;
    const clueName = clue.name.length > maxNameLen ? clue.name.substring(0, maxNameLen - 2) + '..' : clue.name;
    container.add(
      createNoirText(this, -cardWidth / 2 + 10, 10, clueName.toUpperCase(), {
        size: mobile ? 'small' : 'medium',
        color: 'gold',
        origin: { x: 0, y: 0 },
        scale: mobile ? 0.9 : 1,
      })
    );

    // Truncate description
    const maxDescLen = mobile ? 60 : 100;
    const desc = clue.description.length > maxDescLen ? clue.description.substring(0, maxDescLen - 2) + '..' : clue.description;
    container.add(
      createNoirText(this, -cardWidth / 2 + 10, mobile ? 32 : 38, desc.toUpperCase(), {
        size: 'small',
        color: 'gray',
        origin: { x: 0, y: 0 },
        scale: mobile ? 0.8 : 0.9,
        maxWidth: cardWidth - 20,
      })
    );

    if (clue.linkedTo) {
      const suspect = this.currentCase?.suspects.find((s) => s.id === clue.linkedTo);
      if (suspect) {
        const linkText = mobile ? suspect.name : `LINKS TO: ${suspect.name}`;
        container.add(
          createNoirText(this, cardWidth / 2 - 10, cardHeight - 16, linkText.toUpperCase(), {
            size: 'small',
            color: 'red',
            origin: { x: 1, y: 0 },
            scale: mobile ? 0.7 : 0.8,
          })
        );
      }
    }

    return container;
  }

  private renderSuspectsTab(width: number, height: number): void {
    if (!this.currentCase || !this.progress) return;

    const mobile = this.isMobile();
    const suspects = this.currentCase.suspects;

    const summaryY = mobile ? 75 : 90;
    const interrogatedCount = this.progress.suspectsInterrogated.length;
    createNoirText(this, width / 2, summaryY, `SUSPECTS: ${suspects.length} | INTERROGATED: ${interrogatedCount}`, {
      size: 'small',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    });

    const cardHeight = mobile ? 110 : 120;
    const cardSpacing = mobile ? 10 : 12;
    const scrollAreaTop = mobile ? 100 : 115;
    const scrollAreaBottom = height - (mobile ? 50 : 70);
    const scrollAreaHeight = scrollAreaBottom - scrollAreaTop;

    this.scrollContainer = this.add.container(0, scrollAreaTop);

    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, scrollAreaTop, width, scrollAreaHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    suspects.forEach((suspect, index) => {
      const y = index * (cardHeight + cardSpacing);
      const container = this.createSuspectCard(suspect, width, y, cardHeight);
      this.scrollContainer!.add(container);
    });

    const totalContentHeight = suspects.length * (cardHeight + cardSpacing) - cardSpacing;
    this.maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    if (this.maxScroll > 0) {
      this.setupScrolling(width, scrollAreaTop, scrollAreaHeight);
    }
  }

  private createSuspectCard(suspect: Suspect, width: number, y: number, cardHeight: number): GameObjects.Container {
    const mobile = this.isMobile();
    const cardWidth = width - (mobile ? 20 : 60);
    const container = this.add.container(width / 2, y);

    const isInterrogated = this.progress?.suspectsInterrogated.includes(suspect.id) || false;
    const borderColor = isInterrogated ? 0x28a745 : 0x666666;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    bg.lineStyle(2, borderColor, 0.8);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 6);
    container.add(bg);

    // Truncate name
    const maxNameLen = mobile ? 15 : 25;
    const suspectName = suspect.name.length > maxNameLen ? suspect.name.substring(0, maxNameLen - 2) + '..' : suspect.name;
    container.add(
      createNoirText(this, -cardWidth / 2 + 10, 10, suspectName.toUpperCase(), {
        size: mobile ? 'small' : 'medium',
        color: 'white',
        origin: { x: 0, y: 0 },
        scale: mobile ? 0.9 : 1,
      })
    );

    const statusText = isInterrogated ? (mobile ? 'ASKED' : 'INTERROGATED') : (mobile ? 'NEW' : 'NOT QUESTIONED');
    const statusColor = isInterrogated ? 'green' : 'gray';
    container.add(
      createNoirText(this, cardWidth / 2 - 10, 10, statusText, {
        size: 'small',
        color: statusColor,
        origin: { x: 1, y: 0 },
        scale: mobile ? 0.8 : 0.9,
      })
    );

    // Truncate description
    const maxDescLen = mobile ? 40 : 80;
    const desc = suspect.description.length > maxDescLen ? suspect.description.substring(0, maxDescLen - 2) + '..' : suspect.description;
    container.add(
      createNoirText(this, -cardWidth / 2 + 10, mobile ? 30 : 38, desc.toUpperCase(), {
        size: 'small',
        color: 'gray',
        origin: { x: 0, y: 0 },
        scale: mobile ? 0.75 : 0.85,
        maxWidth: cardWidth - 20,
      })
    );

    container.add(
      createNoirText(this, -cardWidth / 2 + 10, cardHeight - 28, 'ALIBI:', {
        size: 'small',
        color: 'red',
        origin: { x: 0, y: 0 },
        scale: mobile ? 0.75 : 0.85,
      })
    );

    const maxAlibiLen = mobile ? 30 : 50;
    const alibiText = suspect.alibi.length > maxAlibiLen ? suspect.alibi.substring(0, maxAlibiLen - 2) + '..' : suspect.alibi;
    container.add(
      createNoirText(this, -cardWidth / 2 + (mobile ? 45 : 55), cardHeight - 28, alibiText.toUpperCase(), {
        size: 'small',
        color: 'lightGray',
        origin: { x: 0, y: 0 },
        scale: mobile ? 0.75 : 0.85,
        maxWidth: cardWidth - (mobile ? 55 : 70),
      })
    );

    return container;
  }

  private renderLinksTab(width: number, height: number): void {
    if (!this.currentCase || !this.progress) return;

    const mobile = this.isMobile();
    const foundClues = this.currentCase.clues.filter((c) => this.progress!.cluesFound.includes(c.id));
    const linkedClues = foundClues.filter((c) => c.linkedTo);

    const summaryY = mobile ? 75 : 90;
    createNoirText(this, width / 2, summaryY, `CONNECTIONS FOUND: ${linkedClues.length}`, {
      size: 'small',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    });

    if (linkedClues.length === 0) {
      createNoirText(this, width / 2, height / 2, 'NO CONNECTIONS YET!', {
        size: 'medium',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      });
      createNoirText(this, width / 2, height / 2 + 30, 'FIND MORE CLUES TO SEE LINKS', {
        size: 'small',
        color: 'darkGray',
        origin: { x: 0.5, y: 0.5 },
      });
      return;
    }

    const rowHeight = mobile ? 50 : 55;
    const scrollAreaTop = mobile ? 100 : 115;
    const scrollAreaBottom = height - (mobile ? 50 : 70);
    const scrollAreaHeight = scrollAreaBottom - scrollAreaTop;

    this.scrollContainer = this.add.container(0, scrollAreaTop);

    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, scrollAreaTop, width, scrollAreaHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    linkedClues.forEach((clue, index) => {
      const y = index * rowHeight;
      const container = this.createLinkRow(clue, width, y, rowHeight);
      this.scrollContainer!.add(container);
    });

    const totalContentHeight = linkedClues.length * rowHeight;
    this.maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    if (this.maxScroll > 0) {
      this.setupScrolling(width, scrollAreaTop, scrollAreaHeight);
    }
  }

  private createLinkRow(clue: Clue, width: number, y: number, rowHeight: number): GameObjects.Container {
    const mobile = this.isMobile();
    const cardWidth = width - (mobile ? 20 : 60);
    const container = this.add.container(width / 2, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, rowHeight - 5, 4);
    bg.lineStyle(1, 0xff4444, 0.6);
    bg.strokeRoundedRect(-cardWidth / 2, 0, cardWidth, rowHeight - 5, 4);
    container.add(bg);

    const suspect = this.currentCase?.suspects.find((s) => s.id === clue.linkedTo);
    const suspectName = suspect?.name || 'UNKNOWN';

    // Draw connection line (shorter on mobile)
    const lineStartX = mobile ? -20 : -cardWidth / 6;
    const lineEndX = mobile ? 20 : cardWidth / 6;
    bg.lineStyle(2, 0xff4444, 0.8);
    bg.lineBetween(lineStartX, (rowHeight - 5) / 2, lineEndX, (rowHeight - 5) / 2);

    // Arrow head
    const arrowY = (rowHeight - 5) / 2;
    bg.fillStyle(0xff4444, 0.8);
    bg.fillTriangle(lineEndX, arrowY, lineEndX - 6, arrowY - 4, lineEndX - 6, arrowY + 4);

    // Truncate names for mobile
    const maxClueLen = mobile ? 12 : 25;
    const maxSuspectLen = mobile ? 10 : 20;
    const clueName = clue.name.length > maxClueLen ? clue.name.substring(0, maxClueLen - 2) + '..' : clue.name;
    const suspectNameTrunc = suspectName.length > maxSuspectLen ? suspectName.substring(0, maxSuspectLen - 2) + '..' : suspectName;

    container.add(
      createNoirText(this, -cardWidth / 2 + 8, (rowHeight - 5) / 2, clueName.toUpperCase(), {
        size: 'small',
        color: 'gold',
        origin: { x: 0, y: 0.5 },
        scale: mobile ? 0.75 : 0.9,
      })
    );

    container.add(
      createNoirText(this, cardWidth / 2 - 8, (rowHeight - 5) / 2, suspectNameTrunc.toUpperCase(), {
        size: 'small',
        color: 'red',
        origin: { x: 1, y: 0.5 },
        scale: mobile ? 0.75 : 0.9,
      })
    );

    return container;
  }

  private setupScrolling(width: number, scrollAreaTop: number, scrollAreaHeight: number): void {
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

    // Single back button centered
    createNoirButton(this, width / 2, btnY, '[BACK]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'white',
      onClick: () => transitionToScene(this, this.returnScene),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });
  }
}
