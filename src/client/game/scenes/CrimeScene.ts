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

  async create() {
    const { width, height } = this.scale;

    // Dark noir background
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Create scanline effect overlay
    this.createScanlines(width, height);

    // Title
    this.add
      .text(width / 2, 30, 'CRIME SCENE INVESTIGATION', {
        fontFamily: 'Courier New',
        fontSize: '24px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Instructions
    this.add
      .text(width / 2, 60, 'Click objects to examine them', {
        fontFamily: 'Courier New',
        fontSize: '14px',
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
    graphics.lineStyle(1, 0x000000, 0.1);
    for (let y = 0; y < height; y += 4) {
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
      // Create fallback data for testing
      this.createFallbackCase();
    }
  }

  private createFallbackCase(): void {
    // Fallback case data for when API is unavailable
    this.currentCase = {
      id: 'case_001',
      title: "The Moderator's Last Ban",
      dayNumber: 1,
      intro: 'A moderator has been found dead...',
      victimName: 'u/ModeratorMax',
      victimDescription: 'Senior moderator',
      location: 'Home Office',
      crimeSceneObjects: [
        {
          id: 'obj_desk',
          name: 'Desk',
          x: 50,
          y: 55,
          width: 30,
          height: 15,
          description: 'A cluttered desk with papers scattered everywhere.',
          clueId: 'clue_threat_letter',
        },
        {
          id: 'obj_keyboard',
          name: 'Broken Keyboard',
          x: 45,
          y: 65,
          width: 15,
          height: 8,
          description: 'A smashed keyboard. Last message: "I know what you did..."',
          clueId: 'clue_message',
        },
        {
          id: 'obj_coffee',
          name: 'Coffee Mug',
          x: 70,
          y: 55,
          width: 8,
          height: 10,
          description: 'Cold coffee with unusual residue. Poison?',
          clueId: 'clue_poison',
        },
        {
          id: 'obj_body',
          name: 'Victim',
          x: 30,
          y: 75,
          width: 20,
          height: 15,
          description: 'The victim lies slumped. No visible wounds.',
        },
      ],
      suspects: [],
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

  private createCrimeSceneArea(width: number, height: number): void {
    if (!this.currentCase) return;

    // Crime scene background area
    const sceneAreaY = 100;
    const sceneAreaHeight = height - 250;
    const sceneAreaWidth = width - 40;

    // Dark room background
    const roomBg = this.add.graphics();
    roomBg.fillStyle(0x16213e, 1);
    roomBg.fillRect(20, sceneAreaY, sceneAreaWidth, sceneAreaHeight);

    // Floor gradient effect
    const floorGradient = this.add.graphics();
    floorGradient.fillStyle(0x0f3460, 1);
    floorGradient.fillRect(20, sceneAreaY + sceneAreaHeight * 0.6, sceneAreaWidth, sceneAreaHeight * 0.4);

    // Create grid lines for pixel art effect
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x1a1a2e, 0.3);

    // Vertical lines
    for (let x = 20; x < width - 20; x += 20) {
      gridGraphics.lineBetween(x, sceneAreaY, x, sceneAreaY + sceneAreaHeight);
    }
    // Horizontal lines
    for (let y = sceneAreaY; y < sceneAreaY + sceneAreaHeight; y += 20) {
      gridGraphics.lineBetween(20, y, width - 20, y);
    }

    // Create interactive objects
    for (const obj of this.currentCase.crimeSceneObjects) {
      this.createInteractiveObject(obj, sceneAreaWidth, sceneAreaHeight, sceneAreaY);
    }

    // Location label
    this.add
      .text(30, sceneAreaY + 10, `Location: ${this.currentCase.location}`, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#666666',
      });
  }

  private createInteractiveObject(
    obj: CrimeSceneObject,
    areaWidth: number,
    areaHeight: number,
    areaY: number
  ): void {
    const x = 20 + (obj.x / 100) * areaWidth;
    const y = areaY + (obj.y / 100) * areaHeight;
    const w = (obj.width / 100) * areaWidth;
    const h = (obj.height / 100) * areaHeight;

    // Create container for the object
    const container = this.add.container(x, y);

    // Object background (pixel art style rectangle)
    const bg = this.add.graphics();
    const isClue = obj.clueId !== undefined;
    const isFound = this.progress?.cluesFound.includes(obj.clueId || '') || false;

    // Different colors for different states
    let fillColor = 0x394867; // default object color
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

    // Object label
    const label = this.add
      .text(0, 0, obj.name, {
        fontFamily: 'Courier New',
        fontSize: '11px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    container.add(label);

    // Clue indicator
    if (isClue) {
      const indicator = this.add
        .text(w / 2 - 5, -h / 2 + 5, isFound ? '✓' : '?', {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: isFound ? '#00ff00' : '#ffff00',
        })
        .setOrigin(0.5);
      container.add(indicator);
    }

    // Make interactive
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
    // Show description in info panel
    this.showInfoPanel(obj.name, obj.description);

    // If object has a clue, try to find it
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

      // Update UI
      this.updateCluePanel();

      // Show clue found notification
      this.showClueFoundNotification(data.clue);
    } catch (error) {
      console.error('Failed to find clue:', error);
      // Fallback: update local state
      if (this.progress && !this.progress.cluesFound.includes(clueId)) {
        this.progress.cluesFound.push(clueId);
        this.updateCluePanel();
      }
    }
  }

  private showClueFoundNotification(clue: Clue): void {
    const { width, height } = this.scale;

    // Create notification container
    const notification = this.add.container(width / 2, height / 2);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-180, -80, 360, 160, 10);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(-180, -80, 360, 160, 10);
    notification.add(bg);

    // Title
    const title = this.add
      .text(0, -50, 'CLUE FOUND!', {
        fontFamily: 'Courier New',
        fontSize: '20px',
        color: '#ffd700',
      })
      .setOrigin(0.5);
    notification.add(title);

    // Clue name
    const nameText = this.add
      .text(0, -20, clue.name, {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    notification.add(nameText);

    // Clue description
    const descText = this.add
      .text(0, 20, clue.description, {
        fontFamily: 'Courier New',
        fontSize: '11px',
        color: '#aaaaaa',
        wordWrap: { width: 320 },
        align: 'center',
      })
      .setOrigin(0.5);
    notification.add(descText);

    // Close button
    const closeBtn = this.add
      .text(0, 60, '[CLICK TO CLOSE]', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#888888',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => notification.destroy());
    notification.add(closeBtn);

    // Auto close after 5 seconds
    this.time.delayedCall(5000, () => {
      if (notification.active) notification.destroy();
    });
  }

  private createInfoPanel(width: number, height: number): void {
    const panelY = height - 130;
    const panelHeight = 100;

    this.infoPanel = this.add.container(width / 2, panelY + panelHeight / 2);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(-width / 2 + 20, -panelHeight / 2, width - 40, panelHeight, 5);
    bg.lineStyle(1, 0x394867, 1);
    bg.strokeRoundedRect(-width / 2 + 20, -panelHeight / 2, width - 40, panelHeight, 5);
    this.infoPanel.add(bg);

    // Placeholder text
    const placeholder = this.add
      .text(0, 0, 'Click on objects to examine them...', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#666666',
        align: 'center',
      })
      .setOrigin(0.5);
    this.infoPanel.add(placeholder);
  }

  private showInfoPanel(title: string, description: string): void {
    if (!this.infoPanel) return;

    const { width } = this.scale;

    // Clear existing content except background
    this.infoPanel.removeAll(true);

    // Recreate background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(-width / 2 + 20, -50, width - 40, 100, 5);
    bg.lineStyle(1, 0xff4444, 1);
    bg.strokeRoundedRect(-width / 2 + 20, -50, width - 40, 100, 5);
    this.infoPanel.add(bg);

    // Title
    const titleText = this.add
      .text(0, -30, title.toUpperCase(), {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: '#ff4444',
      })
      .setOrigin(0.5);
    this.infoPanel.add(titleText);

    // Description
    const descText = this.add
      .text(0, 10, description, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#cccccc',
        wordWrap: { width: width - 80 },
        align: 'center',
      })
      .setOrigin(0.5);
    this.infoPanel.add(descText);
  }

  private createCluePanel(width: number, _height: number): void {
    this.cluePanel = this.add.container(width - 100, 100);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-80, -30, 160, 60, 5);
    bg.lineStyle(1, 0xffd700, 1);
    bg.strokeRoundedRect(-80, -30, 160, 60, 5);
    this.cluePanel.add(bg);

    // Label
    const label = this.add
      .text(0, -15, 'CLUES FOUND', {
        fontFamily: 'Courier New',
        fontSize: '10px',
        color: '#ffd700',
      })
      .setOrigin(0.5);
    this.cluePanel.add(label);

    // Count
    const totalClues = this.currentCase?.clues.length || 0;
    const foundClues = this.progress?.cluesFound.length || 0;
    this.foundCluesText = this.add
      .text(0, 10, `${foundClues} / ${totalClues}`, {
        fontFamily: 'Courier New',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.cluePanel.add(this.foundCluesText);
  }

  private updateCluePanel(): void {
    if (!this.foundCluesText) return;
    const totalClues = this.currentCase?.clues.length || 0;
    const foundClues = this.progress?.cluesFound.length || 0;
    this.foundCluesText.setText(`${foundClues} / ${totalClues}`);
  }

  private createNavigationButtons(width: number, height: number): void {
    // Interrogate button
    const interrogateBtn = this.add
      .text(width / 2 - 100, height - 25, '[ INTERROGATE ]', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#00ff00',
        backgroundColor: '#1a1a2e',
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => interrogateBtn.setColor('#00ffff'))
      .on('pointerout', () => interrogateBtn.setColor('#00ff00'))
      .on('pointerdown', () => this.scene.start('Interrogation'));

    // Accuse button
    const accuseBtn = this.add
      .text(width / 2 + 100, height - 25, '[ ACCUSE ]', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#ff4444',
        backgroundColor: '#1a1a2e',
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => accuseBtn.setColor('#ff8888'))
      .on('pointerout', () => accuseBtn.setColor('#ff4444'))
      .on('pointerdown', () => this.scene.start('Accusation'));
  }

  private handleResize(width: number, height: number): void {
    this.cameras.resize(width, height);
    // For simplicity, restart the scene on resize
    this.scene.restart();
  }
}
