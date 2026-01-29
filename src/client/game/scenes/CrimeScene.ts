import Phaser, { Scene, GameObjects } from 'phaser';
import {
  Case,
  Clue,
  PlayerProgress,
  FindClueResponse,
  WeeklyCase,
  WeeklyProgress,
  CrimeSceneObject,
} from '../../../shared/types/game';
import { case1 } from './crime-scenes/case1';
import { drawCrimeSceneObject } from '../utils/ProceduralGraphics';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen, getScaleFactor } from '../utils/NoirText';
import { GameStateManager } from '../utils/GameStateManager';
import { QuickNotes } from '../utils/QuickNotes';

// Weekly mode scene data interface
interface WeeklyCrimeSceneData {
  weeklyMode?: boolean;
  weeklyCase?: WeeklyCase;
  progress?: WeeklyProgress;
  currentChapter?: number;
}

// Evidence item positions on the crime board
interface BoardItem {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: 'photo' | 'note' | 'evidence';
  label: string;
  description: string;
  clueId?: string | undefined;
  linkedTo?: string[] | undefined;
}

export class CrimeScene extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private boardItems: Map<string, GameObjects.Container> = new Map();
  private redStrings: GameObjects.Graphics | null = null;
  private infoPanel: GameObjects.Container | null = null;
  private cluePanel: GameObjects.Container | null = null;
  private foundCluesText: GameObjects.Text | null = null;
  private boardContainer: GameObjects.Container | null = null;
  private quickNotes: QuickNotes | null = null;

  // Weekly mode properties
  private weeklyMode: boolean = false;
  private weeklyCase: WeeklyCase | null = null;
  private weeklyProgress: WeeklyProgress | null = null;
  private currentChapter: number = 1;

  constructor() {
    super('CrimeScene');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  init(data?: WeeklyCrimeSceneData): void {
    // Reset weekly mode properties
    this.weeklyMode = false;
    this.weeklyCase = null;
    this.weeklyProgress = null;
    this.currentChapter = 1;

    // Check if we're in weekly mode
    if (data?.weeklyMode && data.weeklyCase) {
      this.weeklyMode = true;
      this.weeklyCase = data.weeklyCase;
      this.weeklyProgress = data.progress || null;
      this.currentChapter = data.currentChapter || 1;
    }
  }

  async create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x0a0a14);
    await this.loadGameData();

    // Record game start time for Speed Demon achievement
    this.recordGameStart();

    this.createCrimeBoard(width, height);
    this.createInfoPanel(width, height);
    this.createCluePanel(width, height);
    this.createNavigationButtons(width, height);

    // Add quick notes button
    if (this.currentCase) {
      this.quickNotes = new QuickNotes(this, this.currentCase.id);
    }

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  private async recordGameStart(): Promise<void> {
    try {
      await fetch('/api/game/start', { method: 'POST' });
    } catch (error) {
      console.error('Failed to record game start:', error);
    }
  }

  private async loadGameData(): Promise<void> {
    // If in weekly mode, construct a Case from weekly data
    if (this.weeklyMode && this.weeklyCase) {
      this.currentCase = this.buildCaseFromWeeklyData();
      this.progress = this.buildProgressFromWeeklyData();
      return;
    }

    // Standard daily mode
    try {
      const data = await GameStateManager.loadGameData();
      this.currentCase = data.currentCase;
      this.progress = data.progress;
    } catch (error) {
      console.error('Failed to load game data:', error);
      this.createFallbackCase();
    }
  }

  // Build a Case object from WeeklyCase data, filtered by current chapter
  private buildCaseFromWeeklyData(): Case {
    if (!this.weeklyCase) {
      return { ...case1 };
    }

    // Get all crime scene objects from chapters up to and including current chapter
    const availableObjects: CrimeSceneObject[] = [];
    const availableClues: Clue[] = [];

    for (const chapter of this.weeklyCase.chapters) {
      if (chapter.dayNumber <= this.currentChapter) {
        availableObjects.push(...chapter.crimeSceneObjects);
        availableClues.push(...chapter.newClues);
      }
    }

    return {
      id: this.weeklyCase.id,
      title: this.weeklyCase.title,
      dayNumber: this.currentChapter,
      intro: this.weeklyCase.overallIntro,
      victimName: this.weeklyCase.victimName,
      victimDescription: this.weeklyCase.victimDescription,
      location: this.weeklyCase.location,
      crimeSceneObjects: availableObjects,
      suspects: this.weeklyCase.suspects.filter(s =>
        this.weeklyProgress?.suspectsRevealed.includes(s.id)
      ),
      clues: availableClues,
    };
  }

  // Build PlayerProgress from WeeklyProgress
  private buildProgressFromWeeklyData(): PlayerProgress {
    if (!this.weeklyProgress) {
      return { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
    }

    // Flatten all found clues from all chapters
    const allFoundClues = Object.values(this.weeklyProgress.cluesFoundByChapter).flat();

    const progress: PlayerProgress = {
      odayNumber: this.currentChapter,
      cluesFound: allFoundClues,
      suspectsInterrogated: this.weeklyProgress.witnessesInterrogated,
      solved: this.weeklyProgress.solved,
      correct: this.weeklyProgress.correct,
    };

    if (this.weeklyProgress.accusedSuspect) {
      progress.accusedSuspect = this.weeklyProgress.accusedSuspect;
    }

    return progress;
  }

  private createFallbackCase(): void {
    this.currentCase = { ...case1 };
    this.progress = { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
  }

  private createCrimeBoard(width: number, height: number): void {
    if (!this.currentCase) return;

    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const headerHeight = mobile ? 45 : Math.round(80 * scale);
    const footerHeight = mobile ? 140 : Math.round(200 * scale);
    const boardY = headerHeight;
    const visibleBoardHeight = height - headerHeight - footerHeight;
    const minBoardHeight = mobile ? 500 : visibleBoardHeight;
    const boardHeight = Math.max(visibleBoardHeight, minBoardHeight);

    const padding = mobile ? 8 : 15;
    const maxBoardWidth = 1024;
    const boardWidth = Math.min(width - padding * 2, maxBoardWidth);
    const boardX = (width - boardWidth) / 2;

    this.boardContainer = this.add.container(boardX, boardY);

    if (boardHeight > visibleBoardHeight) {
      const maskShape = this.make.graphics({});
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(boardX, boardY, boardWidth, visibleBoardHeight);
      const mask = maskShape.createGeometryMask();
      this.boardContainer.setMask(mask);
    }

    const bg = this.createCorkBoard(boardWidth, boardHeight);

    if (boardHeight > visibleBoardHeight) {
      bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, boardWidth, boardHeight), Phaser.Geom.Rectangle.Contains);
      this.input.setDraggable(bg);

      bg.on('drag', (pointer: Phaser.Input.Pointer) => {
        if (!this.boardContainer) return;
        const dy = pointer.position.y - pointer.prevPosition.y;
        this.boardContainer.y += dy;
        const minY = boardY - (boardHeight - visibleBoardHeight);
        const maxY = boardY;
        this.boardContainer.y = Phaser.Math.Clamp(this.boardContainer.y, minY, maxY);
      });
    }

    this.createBoardHeader(width, mobile);

    this.redStrings = this.add.graphics();
    this.boardContainer.add(this.redStrings);

    const boardItems = this.createBoardItems();
    for (const item of boardItems) {
      this.createBoardItem(item, boardWidth, boardHeight);
    }
    this.drawRedStrings(boardItems, boardWidth, boardHeight);
    this.createCaseFile(boardWidth, boardHeight, mobile);
  }

  private createCorkBoard(boardWidth: number, boardHeight: number): GameObjects.Graphics {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a1a, 1);
    bg.fillRect(0, 0, boardWidth, boardHeight);

    bg.fillStyle(0x222222, 0.4);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * boardWidth;
      const y = Math.random() * boardHeight;
      const size = 2 + Math.random() * 4;
      bg.fillCircle(x, y, size);
    }

    bg.fillStyle(0x111111, 0.4);
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * boardWidth;
      const y = Math.random() * boardHeight;
      const size = 1 + Math.random() * 3;
      bg.fillCircle(x, y, size);
    }

    const frameWidth = 6;
    bg.fillStyle(0x0f0f0f, 1);
    bg.fillRect(-frameWidth, -frameWidth, boardWidth + frameWidth * 2, frameWidth);
    bg.fillRect(-frameWidth, boardHeight, boardWidth + frameWidth * 2, frameWidth);
    bg.fillRect(-frameWidth, 0, frameWidth, boardHeight);
    bg.fillRect(boardWidth, 0, frameWidth, boardHeight);

    bg.lineStyle(1, 0x333333, 1);
    bg.strokeRect(0, 0, boardWidth, boardHeight);

    this.boardContainer!.add(bg);
    return bg;
  }

  private createBoardHeader(width: number, mobile: boolean): void {
    createNoirText(this, width / 2, mobile ? 12 : 18, 'EVIDENCE BOARD', {
      size: 'medium',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    });

    createNoirText(this, width / 2, mobile ? 30 : 42, 'CONNECT THE CLUES...', {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
      scale: 0.7,
    });
  }

  private createBoardItems(): BoardItem[] {
    if (!this.currentCase) return [];

    const items: BoardItem[] = [
      {
        id: 'victim',
        x: 50,
        y: 15,
        type: 'photo',
        label: this.currentCase.victimName,
        description: this.currentCase.victimDescription || 'The victim',
        linkedTo: ['clue_poison', 'clue_message'],
      },
    ];

    const cluePositions = [
      { x: 20, y: 35 },
      { x: 85, y: 35 },
      { x: 25, y: 70 },
      { x: 75, y: 70 },
      { x: 50, y: 50 },
    ];

    this.currentCase.crimeSceneObjects.forEach((obj, index) => {
      const posIndex = index % cluePositions.length;
      const pos = cluePositions[posIndex]!;
      const item: BoardItem = {
        id: obj.id,
        x: pos.x + (index * 3) % 20 - 10,
        y: pos.y + (index * 5) % 15 - 7,
        type: obj.clueId ? 'evidence' : 'note',
        label: obj.name,
        description: obj.description,
      };
      if (obj.clueId) {
        item.clueId = obj.clueId;
        item.linkedTo = ['victim'];
      }
      items.push(item);
    });

    return items;
  }

  private createBoardItem(item: BoardItem, boardWidth: number, boardHeight: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const x = (item.x / 100) * boardWidth;
    const y = (item.y / 100) * boardHeight;

    const container = this.add.container(x, y);

    const isClue = item.clueId !== undefined;
    const isFound = this.progress?.cluesFound.includes(item.clueId || '') || false;

    let w: number, h: number;
    if (item.type === 'photo') {
      w = mobile ? 55 : Math.round(120 * scale);
      h = mobile ? 65 : Math.round(150 * scale);
    } else if (item.type === 'evidence') {
      w = mobile ? 50 : Math.round(110 * scale);
      h = mobile ? 40 : Math.round(85 * scale);
    } else {
      w = mobile ? 45 : Math.round(100 * scale);
      h = mobile ? 35 : Math.round(75 * scale);
    }

    const bg = this.add.graphics();

    if (item.type === 'photo') {
      bg.fillStyle(0xe8e8e8, 1);
      bg.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 22);
      bg.fillStyle(0x1a1a1a, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);

      if (item.id === 'victim') {
        drawCrimeSceneObject(bg, -w / 2, -h / 2, w, h, 'victim');
      } else {
        const objectType = item.label.toLowerCase();
        if (objectType.includes('desk')) {
          drawCrimeSceneObject(bg, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 'desk');
        } else if (objectType.includes('computer') || objectType.includes('keyboard')) {
          drawCrimeSceneObject(bg, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 'computer');
        } else if (objectType.includes('coffee') || objectType.includes('mug')) {
          drawCrimeSceneObject(bg, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 'mug');
        } else if (objectType.includes('plant')) {
          drawCrimeSceneObject(bg, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 'plant');
        } else if (objectType.includes('window')) {
          drawCrimeSceneObject(bg, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 'window');
        } else if (objectType.includes('phone')) {
          drawCrimeSceneObject(bg, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 'phone');
        } else {
          bg.fillStyle(0x333333, 1);
          bg.fillCircle(0, -h / 4, w / 5);
          bg.fillRect(-w / 5, -h / 4 + w / 8, w / 2.5, h / 3);
        }
      }

      if (item.id === 'victim') {
        bg.lineStyle(3, 0xff0000, 0.85);
        bg.lineBetween(-w / 3, -h / 3, w / 3, h / 3 - 10);
        bg.lineBetween(w / 3, -h / 3, -w / 3, h / 3 - 10);
      }

      bg.fillStyle(0xcc0000, 1);
      bg.fillCircle(0, -h / 2 - 8, 6);
      bg.fillStyle(0xff3333, 1);
      bg.fillCircle(-2, -h / 2 - 10, 2);

      bg.fillStyle(0xff6600, 0.7);
      bg.fillRect(w / 2 - 18, h / 2 - 8, 14, 6);

    } else if (item.type === 'evidence') {
      const cardColor = isFound ? 0xd4edda : (isClue ? 0xf0f0f0 : 0xcccccc);
      bg.fillStyle(cardColor, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);

      bg.fillStyle(0xffffff, 0.4);
      bg.fillRect(-w / 3, -h / 2 - 3, w / 1.5, 8);

      bg.lineStyle(1, isFound ? 0x28a745 : (isClue ? 0x999999 : 0x666666), 1);
      bg.strokeRect(-w / 2, -h / 2, w, h);

      if (isClue) {
        bg.fillStyle(isFound ? 0x28a745 : 0x999999, 1);
        bg.fillCircle(w / 2 - 6, -h / 2 + 6, 6);
      }

    } else {
      bg.fillStyle(0xfffff0, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);

      bg.fillStyle(0xe0e0e0, 1);
      bg.beginPath();
      bg.moveTo(w / 2 - 8, -h / 2);
      bg.lineTo(w / 2, -h / 2 + 8);
      bg.lineTo(w / 2, -h / 2);
      bg.closePath();
      bg.fill();

      bg.fillStyle(0x333333, 1);
      bg.fillCircle(0, -h / 2 + 2, 3);
    }

    container.add(bg);

    // Label - use bitmap text
    const labelY = item.type === 'photo' ? h / 2 + 2 : 0;
    const label = createNoirText(this, 0, labelY, item.label.toUpperCase(), {
      size: 'small',
      color: item.type === 'photo' ? 'gray' : 'darkGray',
      origin: { x: 0.5, y: 0.5 },
      scale: 0.8,
      maxWidth: w - 4,
    });
    container.add(label);

    // Clue indicator
    if (isClue && item.type === 'evidence') {
      const indicatorText = createNoirText(this, w / 2 - 6, -h / 2 + 6, isFound ? 'V' : '?', {
        size: 'small',
        color: isFound ? 'white' : 'darkGray',
        origin: { x: 0.5, y: 0.5 },
        scale: 0.6,
      });
      container.add(indicatorText);
    }

    const hitArea = new Phaser.Geom.Rectangle(-w / 2 - 5, -h / 2 - 5, w + 10, h + 25);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      container.setScale(1.1);
      container.setDepth(100);
    });

    container.on('pointerout', () => {
      container.setScale(1);
      container.setDepth(1);
    });

    container.on('pointerdown', () => {
      void this.examineItem(item);
    });

    this.boardContainer!.add(container);
    this.boardItems.set(item.id, container);
  }

  private drawRedStrings(items: BoardItem[], boardWidth: number, boardHeight: number): void {
    if (!this.redStrings) return;

    this.redStrings.clear();
    this.redStrings.lineStyle(2, 0xcc0000, 0.7);

    for (const item of items) {
      if (!item.linkedTo) continue;

      const fromX = (item.x / 100) * boardWidth;
      const fromY = (item.y / 100) * boardHeight;

      for (const targetId of item.linkedTo) {
        const targetItem = items.find(i => i.id === targetId || i.clueId === targetId);
        if (targetItem) {
          const toX = (targetItem.x / 100) * boardWidth;
          const toY = (targetItem.y / 100) * boardHeight;

          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2 + 15;

          const steps = 10;
          this.redStrings.beginPath();
          this.redStrings.moveTo(fromX, fromY);
          for (let t = 1; t <= steps; t++) {
            const p = t / steps;
            const invP = 1 - p;
            const px = invP * invP * fromX + 2 * invP * p * midX + p * p * toX;
            const py = invP * invP * fromY + 2 * invP * p * midY + p * p * toY;
            this.redStrings.lineTo(px, py);
          }
          this.redStrings.strokePath();

          this.redStrings.fillStyle(0xff0000, 1);
          this.redStrings.fillCircle(fromX, fromY, 3);
        }
      }
    }

    const foundClueItems = items.filter(i =>
      i.clueId && this.progress?.cluesFound.includes(i.clueId)
    );

    if (foundClueItems.length >= 2) {
      this.redStrings.lineStyle(1.5, 0xff4444, 0.5);

      for (let i = 0; i < foundClueItems.length - 1; i++) {
        const from = foundClueItems[i]!;
        const to = foundClueItems[i + 1]!;

        const fromX = (from.x / 100) * boardWidth;
        const fromY = (from.y / 100) * boardHeight;
        const toX = (to.x / 100) * boardWidth;
        const toY = (to.y / 100) * boardHeight;

        this.redStrings.lineBetween(fromX, fromY, toX, toY);
      }
    }
  }

  private createCaseFile(boardWidth: number, boardHeight: number, mobile: boolean): void {
    const scale = getScaleFactor(this);
    const fileW = mobile ? 60 : Math.round(130 * scale);
    const fileH = mobile ? 45 : Math.round(90 * scale);
    const x = boardWidth - fileW / 2 - 10;
    const y = boardHeight - fileH / 2 - 10;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 1);
    bg.fillRect(-fileW / 2, -fileH / 2, fileW, fileH);
    bg.fillRect(-fileW / 2 + 10, -fileH / 2 - 8, fileW / 3, 10);
    bg.fillStyle(0x222222, 1);
    bg.fillRect(-fileW / 2 + 2, fileH / 2 - 3, fileW - 4, 3);

    container.add(bg);

    const caseLabel = createNoirText(this, 0, -5, `CASE\n#${this.currentCase?.dayNumber.toString().padStart(3, '0') || '001'}`, {
      size: 'small',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
      align: 1,
    });
    container.add(caseLabel);

    this.boardContainer!.add(container);
  }

  private async examineItem(item: BoardItem): Promise<void> {
    this.showInfoPanel(item.label, item.description);

    if (item.clueId && !this.progress?.cluesFound.includes(item.clueId)) {
      await this.findClue(item.clueId);

      const boardItems = this.createBoardItems();
      const mobile = this.isMobile();
      const padding = mobile ? 8 : 15;
      const headerHeight = mobile ? 45 : 60;
      const footerHeight = mobile ? 100 : 130;
      const boardWidth = this.scale.width - padding * 2;
      const boardHeight = this.scale.height - headerHeight - footerHeight;
      this.drawRedStrings(boardItems, boardWidth, boardHeight);
    }
  }

  private async findClue(clueId: string): Promise<void> {
    try {
      // Use different API for weekly mode
      if (this.weeklyMode) {
        const response = await fetch('/api/weekly/find-clue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clueId, chapterDay: this.currentChapter }),
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        this.weeklyProgress = data.progress;
        this.progress = this.buildProgressFromWeeklyData();
        this.updateCluePanel();
        this.showClueFoundNotification(data.clue);
        return;
      }

      // Standard daily mode
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
      this.updateCluePanel();
      this.showClueFoundNotification(data.clue);
    } catch (error) {
      console.error('Failed to find clue:', error);
      if (this.progress && !this.progress.cluesFound.includes(clueId)) {
        this.progress.cluesFound.push(clueId);
        if (!this.weeklyMode) {
          GameStateManager.updateProgress(this.progress);
        }
        this.updateCluePanel();
      }
    }
  }

  private showClueFoundNotification(clue: Clue): void {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const panelW = mobile ? width - 40 : 320;

    const notification = this.add.container(width / 2, height / 2);
    notification.setDepth(200);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.98);
    bg.fillRoundedRect(-panelW / 2, -80, panelW, 160, 8);
    bg.lineStyle(3, 0xff4444, 1);
    bg.strokeRoundedRect(-panelW / 2, -80, panelW, 160, 8);
    notification.add(bg);

    bg.lineStyle(2, 0xcc0000, 0.6);
    bg.lineBetween(-panelW / 2 + 20, -70, panelW / 2 - 20, -70);

    notification.add(createNoirText(this, 0, -55, 'EVIDENCE FOUND!', {
      size: 'medium',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
    }));

    notification.add(createNoirText(this, 0, -25, clue.name.toUpperCase(), {
      size: 'medium',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    }));

    notification.add(createNoirText(this, 0, 15, clue.description.toUpperCase(), {
      size: 'small',
      color: 'lightGray',
      origin: { x: 0.5, y: 0.5 },
      maxWidth: panelW - 30,
      align: 1,
    }));

    notification.add(createNoirText(this, 0, 55, '[TAP TO CLOSE]', {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    }));

    bg.setInteractive(new Phaser.Geom.Rectangle(-panelW / 2, -80, panelW, 160), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', () => notification.destroy());
  }

  private createInfoPanel(width: number, height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const panelHeight = mobile ? 85 : Math.round(140 * scale);
    const panelY = height - (mobile ? 135 : Math.round(195 * scale));

    this.infoPanel = this.add.container(width / 2, panelY + panelHeight / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    bg.lineStyle(1, 0x394867, 1);
    bg.strokeRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    this.infoPanel.add(bg);

    const placeholder = createNoirText(this, 0, 0, 'TAP EVIDENCE TO EXAMINE...', {
      size: 'medium',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });
    this.infoPanel.add(placeholder);
  }

  private showInfoPanel(title: string, description: string): void {
    if (!this.infoPanel) return;
    const { width } = this.scale;
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const panelHeight = mobile ? 110 : Math.round(160 * scale);

    this.infoPanel.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    bg.lineStyle(1, 0xff4444, 1);
    bg.strokeRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    this.infoPanel.add(bg);

    this.infoPanel.add(createNoirText(this, 0, -panelHeight / 2 + 15, title.toUpperCase(), {
      size: 'medium',
      color: 'red',
      origin: { x: 0.5, y: 0 },
    }));

    // Description text
    this.infoPanel.add(createNoirText(this, 0, -panelHeight / 2 + 45, description.toUpperCase(), {
      size: 'small',
      color: 'lightGray',
      origin: { x: 0.5, y: 0 },
      maxWidth: width - 50,
    }));
  }

  private getBoardClueCount(): { total: number; found: number } {
    if (!this.currentCase) return { total: 0, found: 0 };

    // Get clue IDs that are findable on the crime board (linked to crime scene objects)
    const boardClueIds = new Set(
      this.currentCase.crimeSceneObjects
        .filter(obj => obj.clueId)
        .map(obj => obj.clueId!)
    );

    const total = boardClueIds.size;
    const found = this.progress?.cluesFound.filter(id => boardClueIds.has(id)).length || 0;

    return { total, found };
  }

  private createCluePanel(width: number, _height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const panelW = mobile ? 80 : Math.round(150 * scale);
    const panelH = mobile ? 35 : Math.round(60 * scale);

    this.cluePanel = this.add.container(width - panelW / 2 - 10, mobile ? 35 : 50);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 5);
    bg.lineStyle(1, 0xff4444, 1);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 5);
    this.cluePanel.add(bg);

    this.cluePanel.add(createNoirText(this, 0, mobile ? -8 : -10, 'EVIDENCE', {
      size: 'small',
      color: 'red',
      origin: { x: 0.5, y: 0.5 },
      scale: 0.6,
    }));

    const { total, found } = this.getBoardClueCount();
    this.foundCluesText = createNoirText(this, 0, mobile ? 7 : 8, `${found}/${total}`, {
      size: 'small',
      color: 'white',
      origin: { x: 0.5, y: 0.5 },
    });
    this.cluePanel.add(this.foundCluesText);
  }

  private updateCluePanel(): void {
    if (!this.foundCluesText) return;
    const { total, found } = this.getBoardClueCount();
    this.foundCluesText.setText(`${found}/${total}`);
  }

  private createNavigationButtons(width: number, height: number): void {
    const mobile = this.isMobile();
    const scale = getScaleFactor(this);
    const navHeight = mobile ? 50 : Math.round(80 * scale);
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

    createNoirButton(this, btnX1, btnY, mobile ? '[ASK]' : '[ INTERROGATE ]', {
      size: 'small',
      color: 'green',
      hoverColor: 'cyan',
      onClick: () => this.goToInterrogation(),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });

    createNoirButton(this, btnX2, btnY, this.weeklyMode ? '[BACK]' : '[NOTES]', {
      size: 'small',
      color: 'gold',
      hoverColor: 'white',
      onClick: () => this.weeklyMode ? this.goBack() : this.quickNotes?.open(),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });

    createNoirButton(this, btnX3, btnY, mobile ? '[ACCUSE]' : '[ ACCUSE ]', {
      size: 'small',
      color: 'red',
      hoverColor: 'gold',
      onClick: () => this.goToAccusation(),
      padding: { x: mobile ? 8 : 12, y: 8 },
    });
  }

  private handleResize(width: number, height: number): void {
    this.cameras.resize(width, height);
    this.scene.restart();
  }

  private goToInterrogation(): void {
    if (this.weeklyMode) {
      transitionToScene(this, 'Interrogation', {
        weeklyMode: true,
        weeklyCase: this.weeklyCase,
        progress: this.weeklyProgress,
        currentChapter: this.currentChapter,
      });
    } else {
      transitionToScene(this, 'Interrogation');
    }
  }

  private goToAccusation(): void {
    if (this.weeklyMode) {
      transitionToScene(this, 'Accusation', {
        weeklyMode: true,
        weeklyCase: this.weeklyCase,
        progress: this.weeklyProgress,
      });
    } else {
      transitionToScene(this, 'Accusation');
    }
  }

  private goBack(): void {
    if (this.weeklyMode) {
      transitionToScene(this, 'ChapterScene', {
        dayNumber: this.currentChapter,
        weeklyCase: this.weeklyCase,
        progress: this.weeklyProgress,
      });
    } else {
      transitionToScene(this, 'MainMenu');
    }
  }
}
