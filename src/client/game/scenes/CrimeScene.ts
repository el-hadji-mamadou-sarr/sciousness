import { Scene, GameObjects } from 'phaser';
import {
  Case,
  CrimeSceneObject,
  Clue,
  PlayerProgress,
  InitGameResponse,
  FindClueResponse,
} from '../../../shared/types/game';

export class CrimeScene extends Scene {
  private currentCase: Case | null = null;
  private progress: PlayerProgress | null = null;
  private interactiveObjects: Map<string, GameObjects.Container> = new Map();
  private infoPanel: GameObjects.Container | null = null;
  private cluePanel: GameObjects.Container | null = null;
  private foundCluesText: GameObjects.Text | null = null;

  constructor() {
    super('CrimeScene');
  }

  // Helper to get responsive font size
  private getFontSize(base: number): number {
    const { width } = this.scale;
    // Use 320px as reference for mobile, scale up from there
    const scale = Math.min(width / 320, 1.5);
    // Ensure minimum readable size (at least 70% of base, minimum 10px)
    return Math.max(Math.floor(base * scale), Math.floor(base * 0.7), 10);
  }

  // Check if mobile
  private isMobile(): boolean {
    return this.scale.width < 500;
  }

  async create() {
    const { width, height } = this.scale;

    // Dark noir background
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Create scanline effect overlay (less dense on mobile)
    this.createScanlines(width, height);

    // Title
    this.add
      .text(width / 2, this.isMobile() ? 20 : 30, 'CRIME SCENE', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(20)}px`,
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Instructions
    this.add
      .text(width / 2, this.isMobile() ? 42 : 60, 'Tap objects to examine', {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(11)}px`,
        color: '#888888',
      })
      .setOrigin(0.5);

    // Fetch case data
    await this.loadGameData();

    // Create the crime scene area
    this.createCrimeSceneArea(width, height);

    // Create info panel for object descriptions
    this.createInfoPanel(width, height);

    // Create clue counter panel
    this.createCluePanel(width, height);

    // Create navigation buttons
    this.createNavigationButtons(width, height);

    // Handle resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  private createScanlines(width: number, height: number): void {
    const graphics = this.add.graphics();
    const spacing = this.isMobile() ? 6 : 4;
    graphics.lineStyle(1, 0x000000, 0.08);
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
      id: 'case_001',
      title: "The Moderator's Last Ban",
      dayNumber: 1,
      intro: 'A moderator has been found dead...',
      victimName: 'u/ModeratorMax',
      victimDescription: 'Senior moderator',
      location: 'Home Office',
      crimeSceneObjects: [
        { id: 'obj_desk', name: 'Desk', x: 50, y: 45, width: 28, height: 18, description: 'A cluttered desk with papers.', clueId: 'clue_threat_letter' },
        { id: 'obj_keyboard', name: 'Keyboard', x: 35, y: 55, width: 18, height: 10, description: 'Smashed keyboard: "I know what you did..."', clueId: 'clue_message' },
        { id: 'obj_coffee', name: 'Coffee', x: 68, y: 48, width: 12, height: 14, description: 'Cold coffee with residue. Poison?', clueId: 'clue_poison' },
        { id: 'obj_body', name: 'Victim', x: 50, y: 75, width: 22, height: 18, description: 'The victim. No visible wounds.' },
      ],
      suspects: [],
      clues: [],
    };
    this.progress = { odayNumber: 1, cluesFound: [], suspectsInterrogated: [], solved: false, correct: false };
  }

  private createCrimeSceneArea(width: number, height: number): void {
    if (!this.currentCase) return;

    const mobile = this.isMobile();
    const headerHeight = mobile ? 55 : 80;
    const footerHeight = mobile ? 100 : 150;
    const sceneAreaY = headerHeight;
    const sceneAreaHeight = height - headerHeight - footerHeight;
    const padding = mobile ? 8 : 20;
    const sceneAreaWidth = width - padding * 2;

    // Dark room background
    const roomBg = this.add.graphics();
    roomBg.fillStyle(0x16213e, 1);
    roomBg.fillRect(padding, sceneAreaY, sceneAreaWidth, sceneAreaHeight);

    // Floor
    const floorGradient = this.add.graphics();
    floorGradient.fillStyle(0x0f3460, 1);
    floorGradient.fillRect(padding, sceneAreaY + sceneAreaHeight * 0.6, sceneAreaWidth, sceneAreaHeight * 0.4);

    // Grid lines (sparser on mobile)
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x1a1a2e, 0.2);
    const gridSize = mobile ? 30 : 20;
    for (let x = padding; x < width - padding; x += gridSize) {
      gridGraphics.lineBetween(x, sceneAreaY, x, sceneAreaY + sceneAreaHeight);
    }
    for (let y = sceneAreaY; y < sceneAreaY + sceneAreaHeight; y += gridSize) {
      gridGraphics.lineBetween(padding, y, width - padding, y);
    }

    // Create interactive objects
    for (const obj of this.currentCase.crimeSceneObjects) {
      this.createInteractiveObject(obj, sceneAreaWidth, sceneAreaHeight, sceneAreaY, padding);
    }

    // Location label
    this.add.text(padding + 5, sceneAreaY + 5, this.currentCase.location, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(9)}px`,
      color: '#444444',
    });
  }

  private createInteractiveObject(
    obj: CrimeSceneObject,
    areaWidth: number,
    areaHeight: number,
    areaY: number,
    padding: number
  ): void {
    const x = padding + (obj.x / 100) * areaWidth;
    const y = areaY + (obj.y / 100) * areaHeight;
    const w = Math.max((obj.width / 100) * areaWidth, 40); // Min 40px width for touch
    const h = Math.max((obj.height / 100) * areaHeight, 35); // Min 35px height for touch

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const isClue = obj.clueId !== undefined;
    const isFound = this.progress?.cluesFound.includes(obj.clueId || '') || false;

    let fillColor = 0x394867;
    let strokeColor = 0x5c6b8a;

    if (obj.id === 'obj_body') {
      fillColor = 0x4a1c1c;
      strokeColor = 0x7a3333;
    } else if (isClue && isFound) {
      fillColor = 0x1e5631;
      strokeColor = 0x2e7d32;
    } else if (isClue) {
      fillColor = 0x4a3c1c;
      strokeColor = 0x7a6333;
    }

    bg.fillStyle(fillColor, 1);
    bg.fillRect(-w / 2, -h / 2, w, h);
    bg.lineStyle(2, strokeColor, 1);
    bg.strokeRect(-w / 2, -h / 2, w, h);
    container.add(bg);

    // Label
    const label = this.add
      .text(0, 0, obj.name, {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(9)}px`,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    container.add(label);

    // Clue indicator
    if (isClue) {
      const indicator = this.add
        .text(w / 2 - 8, -h / 2 + 8, isFound ? '✓' : '?', {
          fontFamily: 'Arial',
          fontSize: `${this.getFontSize(12)}px`,
          color: isFound ? '#00ff00' : '#ffff00',
        })
        .setOrigin(0.5);
      container.add(indicator);
    }

    // Interactive area
    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5c6b8a, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);
      bg.lineStyle(3, 0xffffff, 1);
      bg.strokeRect(-w / 2, -h / 2, w, h);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(fillColor, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);
      bg.lineStyle(2, strokeColor, 1);
      bg.strokeRect(-w / 2, -h / 2, w, h);
    });
    container.on('pointerdown', () => this.examineObject(obj));

    this.interactiveObjects.set(obj.id, container);
  }

  private async examineObject(obj: CrimeSceneObject): Promise<void> {
    this.showInfoPanel(obj.name, obj.description);
    if (obj.clueId && !this.progress?.cluesFound.includes(obj.clueId)) {
      await this.findClue(obj.clueId);
    }
  }

  private async findClue(clueId: string): Promise<void> {
    try {
      const response = await fetch('/api/game/find-clue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clueId }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = (await response.json()) as FindClueResponse;
      this.progress = data.progress;
      this.updateCluePanel();
      this.showClueFoundNotification(data.clue);
    } catch (error) {
      console.error('Failed to find clue:', error);
      if (this.progress && !this.progress.cluesFound.includes(clueId)) {
        this.progress.cluesFound.push(clueId);
        this.updateCluePanel();
      }
    }
  }

  private showClueFoundNotification(clue: Clue): void {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const panelW = mobile ? width - 40 : 340;

    const notification = this.add.container(width / 2, height / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.98);
    bg.fillRoundedRect(-panelW / 2, -70, panelW, 140, 8);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(-panelW / 2, -70, panelW, 140, 8);
    notification.add(bg);

    notification.add(this.add.text(0, -45, 'CLUE FOUND!', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(16)}px`, color: '#ffd700',
    }).setOrigin(0.5));

    notification.add(this.add.text(0, -20, clue.name, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(13)}px`, color: '#ffffff',
    }).setOrigin(0.5));

    notification.add(this.add.text(0, 15, clue.description, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(9)}px`, color: '#aaaaaa',
      wordWrap: { width: panelW - 30 }, align: 'center',
    }).setOrigin(0.5));

    const closeBtn = this.add.text(0, 50, '[TAP TO CLOSE]', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(10)}px`, color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => notification.destroy());
    notification.add(closeBtn);

    this.time.delayedCall(4000, () => { if (notification.active) notification.destroy(); });
  }

  private createInfoPanel(width: number, height: number): void {
    const mobile = this.isMobile();
    const panelHeight = mobile ? 60 : 80;
    const panelY = height - (mobile ? 95 : 120);

    this.infoPanel = this.add.container(width / 2, panelY + panelHeight / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    bg.lineStyle(1, 0x394867, 1);
    bg.strokeRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    this.infoPanel.add(bg);

    const placeholder = this.add.text(0, 0, 'Tap objects to examine...', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(11)}px`, color: '#666666', align: 'center',
    }).setOrigin(0.5);
    this.infoPanel.add(placeholder);
  }

  private showInfoPanel(title: string, description: string): void {
    if (!this.infoPanel) return;
    const { width } = this.scale;
    const mobile = this.isMobile();
    const panelHeight = mobile ? 60 : 80;

    this.infoPanel.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    bg.lineStyle(1, 0xff4444, 1);
    bg.strokeRoundedRect(-width / 2 + 10, -panelHeight / 2, width - 20, panelHeight, 5);
    this.infoPanel.add(bg);

    this.infoPanel.add(this.add.text(0, mobile ? -18 : -25, title.toUpperCase(), {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(12)}px`, color: '#ff4444',
    }).setOrigin(0.5));

    this.infoPanel.add(this.add.text(0, mobile ? 8 : 10, description, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(9)}px`, color: '#cccccc',
      wordWrap: { width: width - 40 }, align: 'center',
    }).setOrigin(0.5));
  }

  private createCluePanel(width: number, _height: number): void {
    const mobile = this.isMobile();
    const panelW = mobile ? 90 : 140;
    const panelH = mobile ? 40 : 50;

    this.cluePanel = this.add.container(width - panelW / 2 - 10, mobile ? 48 : 80);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 5);
    bg.lineStyle(1, 0xffd700, 1);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 5);
    this.cluePanel.add(bg);

    this.cluePanel.add(this.add.text(0, mobile ? -10 : -12, 'CLUES', {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(8)}px`, color: '#ffd700',
    }).setOrigin(0.5));

    const totalClues = this.currentCase?.clues.length || 0;
    const foundClues = this.progress?.cluesFound.length || 0;
    this.foundCluesText = this.add.text(0, mobile ? 8 : 10, `${foundClues}/${totalClues}`, {
      fontFamily: 'Courier New', fontSize: `${this.getFontSize(14)}px`, color: '#ffffff',
    }).setOrigin(0.5);
    this.cluePanel.add(this.foundCluesText);
  }

  private updateCluePanel(): void {
    if (!this.foundCluesText) return;
    const totalClues = this.currentCase?.clues.length || 0;
    const foundClues = this.progress?.cluesFound.length || 0;
    this.foundCluesText.setText(`${foundClues}/${totalClues}`);
  }

  private createNavigationButtons(width: number, height: number): void {
    const mobile = this.isMobile();
    const btnFontSize = this.getFontSize(11);
    const btnY = height - (mobile ? 18 : 22);
    const btnPadding = mobile ? { x: 8, y: 5 } : { x: 12, y: 6 };

    const interrogateBtn = this.add
      .text(width / 2 - (mobile ? 55 : 90), btnY, mobile ? '[INTERROGATE]' : '[ INTERROGATE ]', {
        fontFamily: 'Courier New', fontSize: `${btnFontSize}px`, color: '#00ff00',
        backgroundColor: '#1a1a2e', padding: btnPadding,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => interrogateBtn.setColor('#00ffff'))
      .on('pointerout', () => interrogateBtn.setColor('#00ff00'))
      .on('pointerdown', () => this.scene.start('Interrogation'));

    const accuseBtn = this.add
      .text(width / 2 + (mobile ? 55 : 90), btnY, mobile ? '[ACCUSE]' : '[ ACCUSE ]', {
        fontFamily: 'Courier New', fontSize: `${btnFontSize}px`, color: '#ff4444',
        backgroundColor: '#1a1a2e', padding: btnPadding,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => accuseBtn.setColor('#ff8888'))
      .on('pointerout', () => accuseBtn.setColor('#ff4444'))
      .on('pointerdown', () => this.scene.start('Accusation'));
  }

  private handleResize(width: number, height: number): void {
    this.cameras.resize(width, height);
    this.scene.restart();
  }
}
