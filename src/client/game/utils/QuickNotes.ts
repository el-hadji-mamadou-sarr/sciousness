import { Scene, GameObjects } from 'phaser';
import { createNoirText, createNoirButton, isMobileScreen } from './NoirText';

const NOTES_STORAGE_KEY = 'noir_detective_notes';

interface NotesData {
  [caseId: string]: string;
}

export class QuickNotes {
  private scene: Scene;
  private panel: GameObjects.Container | null = null;
  private isOpen: boolean = false;
  private notesText: string = '';
  private caseId: string;
  private inputElement: HTMLTextAreaElement | null = null;
  private htmlCloseButton: HTMLButtonElement | null = null;

  constructor(scene: Scene, caseId: string) {
    this.scene = scene;
    this.caseId = caseId;
    this.loadNotes();
    this.createPanel();
  }

  private isMobile(): boolean {
    return isMobileScreen(this.scene);
  }

  private loadNotes(): void {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) {
        const data: NotesData = JSON.parse(stored);
        this.notesText = data[this.caseId] || '';
      }
    } catch {
      this.notesText = '';
    }
  }

  private saveNotes(): void {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      const data: NotesData = stored ? JSON.parse(stored) : {};
      data[this.caseId] = this.notesText;
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  private createPanel(): void {
    const { width, height } = this.scene.scale;
    const mobile = this.isMobile();

    this.panel = this.scene.add.container(width / 2, height / 2);
    this.panel.setDepth(200);
    this.panel.setVisible(false);

    const panelWidth = mobile ? width - 30 : 350;
    const panelHeight = mobile ? height - 120 : 400;

    // Dim background
    const dimBg = this.scene.add.graphics();
    dimBg.fillStyle(0x000000, 0.7);
    dimBg.fillRect(-width / 2, -height / 2, width, height);
    dimBg.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    dimBg.on('pointerdown', () => this.close());
    this.panel.add(dimBg);

    // Panel background
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x0a0a14, 0.98);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    panelBg.lineStyle(2, 0xffd700, 0.8);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    panelBg.setInteractive(new Phaser.Geom.Rectangle(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight), Phaser.Geom.Rectangle.Contains);
    this.panel.add(panelBg);

    // Title
    this.panel.add(createNoirText(this.scene, 0, -panelHeight / 2 + 20, 'DETECTIVE NOTES', {
      size: 'medium',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    }));

    // Subtitle
    this.panel.add(createNoirText(this.scene, 0, -panelHeight / 2 + 45, 'YOUR PRIVATE NOTES FOR THIS CASE', {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
      scale: 0.7,
    }));

    // Close button
    const closeBtn = createNoirButton(this.scene, panelWidth / 2 - 25, -panelHeight / 2 + 20, 'X', {
      size: 'small',
      color: 'red',
      hoverColor: 'white',
      onClick: () => this.close(),
      padding: { x: 8, y: 4 },
    });
    this.panel.add(closeBtn);

    // Clear button
    const clearBtn = createNoirButton(this.scene, 0, panelHeight / 2 - 30, '[CLEAR NOTES]', {
      size: 'small',
      color: 'gray',
      hoverColor: 'red',
      onClick: () => this.clearNotes(),
      padding: { x: 12, y: 6 },
    });
    this.panel.add(clearBtn);
  }

  private createTextInput(): void {
    if (this.inputElement) return;

    const { width, height } = this.scene.scale;
    const mobile = this.isMobile();
    const panelWidth = mobile ? width - 30 : 350;
    const panelHeight = mobile ? height - 120 : 400;

    // Create HTML textarea for actual text input
    this.inputElement = document.createElement('textarea');
    this.inputElement.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: ${panelWidth - 40}px;
      height: ${panelHeight - 130}px;
      margin-top: 10px;
      background: rgba(10, 10, 20, 0.95);
      border: 1px solid #ffd700;
      border-radius: 4px;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      font-size: ${mobile ? '14px' : '13px'};
      padding: 10px;
      resize: none;
      outline: none;
      z-index: 1000;
    `;
    this.inputElement.placeholder = 'Type your notes here...\n\nExample:\n- Suspect A has no alibi\n- Found poison in coffee\n- Check the garden connection';
    this.inputElement.value = this.notesText;

    this.inputElement.addEventListener('input', () => {
      if (this.inputElement) {
        this.notesText = this.inputElement.value;
        this.saveNotes();
      }
    });

    document.body.appendChild(this.inputElement);
    this.inputElement.focus();

    // Create HTML close button for mobile - positioned above the textarea
    if (mobile) {
      this.htmlCloseButton = document.createElement('button');
      this.htmlCloseButton.textContent = '✕ CLOSE';
      this.htmlCloseButton.style.cssText = `
        position: absolute;
        left: 50%;
        top: calc(50% - ${panelHeight / 2 - 25}px);
        transform: translateX(-50%);
        background: rgba(40, 40, 60, 0.95);
        border: 1px solid #ffd700;
        border-radius: 4px;
        color: #ffd700;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        padding: 8px 20px;
        cursor: pointer;
        z-index: 1001;
        touch-action: manipulation;
      `;
      this.htmlCloseButton.addEventListener('click', () => this.close());
      this.htmlCloseButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.close();
      });
      document.body.appendChild(this.htmlCloseButton);
    }
  }

  private removeTextInput(): void {
    if (this.inputElement) {
      this.inputElement.remove();
      this.inputElement = null;
    }
    if (this.htmlCloseButton) {
      this.htmlCloseButton.remove();
      this.htmlCloseButton = null;
    }
  }

  public open(): void {
    if (!this.panel) return;
    this.isOpen = true;
    this.panel.setVisible(true);
    this.createTextInput();
  }

  public close(): void {
    if (!this.panel) return;
    this.isOpen = false;
    this.panel.setVisible(false);
    this.removeTextInput();
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private clearNotes(): void {
    this.notesText = '';
    this.saveNotes();
    if (this.inputElement) {
      this.inputElement.value = '';
    }
  }

  public destroy(): void {
    this.removeTextInput();
    if (this.panel) {
      this.panel.destroy();
    }
  }

  public getNotes(): string {
    return this.notesText;
  }
}
