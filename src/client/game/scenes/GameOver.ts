import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress } from '../../../shared/types/game';

interface GameOverData {
  correct: boolean;
  accusedName: string;
  guiltyName: string;
  evidence: string[];
  currentCase: Case | null;
  progress: PlayerProgress | null;
}

export class GameOver extends Scene {
  private data: GameOverData | null = null;

  constructor() {
    super('GameOver');
  }

  private getFontSize(base: number): number {
    const { width } = this.scale;
    const scale = Math.min(width / 320, 1.5);
    return Math.max(Math.floor(base * scale), Math.floor(base * 0.7), 10);
  }

  private isMobile(): boolean {
    return this.scale.width < 500;
  }

  init(data: GameOverData) {
    this.data = data;
  }

  create() {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const correct = this.data?.correct ?? false;

    // Background
    this.cameras.main.setBackgroundColor(correct ? 0x0a1a0a : 0x1a0a0a);
    this.createScanlines(width, height);

    // Glow effect
    const glowColor = correct ? 0x00ff00 : 0xff0000;
    const glow = this.add.graphics();
    glow.fillStyle(glowColor, 0.03);
    glow.fillCircle(width / 2, height / 3, mobile ? 120 : 180);

    // Result badge
    this.createResultBadge(width, mobile, correct);

    // Case info
    this.createCaseInfo(width, mobile);

    // Explanation panel
    this.createExplanationPanel(width, height, mobile, correct);

    // Stats panel
    this.createStatsPanel(width, height, mobile);

    // Play again button
    this.createPlayAgainButton(width, height, mobile);

    this.scale.on('resize', () => this.scene.restart(this.data ?? undefined));
  }

  private createScanlines(width: number, height: number): void {
    const graphics = this.add.graphics();
    const spacing = this.isMobile() ? 5 : 3;
    graphics.lineStyle(1, 0x000000, 0.15);
    for (let y = 0; y < height; y += spacing) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  private createResultBadge(width: number, mobile: boolean, correct: boolean): void {
    const badgeY = mobile ? 40 : 60;
    const badgeSize = mobile ? 50 : 70;

    // Badge circle
    const badge = this.add.graphics();
    badge.lineStyle(3, correct ? 0x00ff00 : 0xff0000, 1);
    badge.strokeCircle(width / 2, badgeY, badgeSize);
    badge.lineStyle(1, correct ? 0x00ff00 : 0xff0000, 0.3);
    badge.strokeCircle(width / 2, badgeY, badgeSize + 8);

    // Result icon
    const icon = correct ? '✓' : '✗';
    this.add.text(width / 2, badgeY, icon, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(32)}px`,
      color: correct ? '#00ff00' : '#ff0000',
      resolution: 2,
    }).setOrigin(0.5);

    // Title text
    const titleY = badgeY + badgeSize + (mobile ? 15 : 25);
    const titleText = correct ? 'CASE SOLVED' : 'CASE FAILED';
    this.add.text(width / 2, titleY, titleText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(20)}px`,
      color: correct ? '#00ff00' : '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
      resolution: 2,
    }).setOrigin(0.5);
  }

  private createCaseInfo(width: number, mobile: boolean): void {
    const caseTitle = this.data?.currentCase?.title ?? 'Unknown Case';
    const y = mobile ? 120 : 170;

    this.add.text(width / 2, y, caseTitle, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(10)}px`,
      color: '#888888',
      resolution: 2,
    }).setOrigin(0.5);
  }

  private createExplanationPanel(width: number, height: number, mobile: boolean, correct: boolean): void {
    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 100 : 120;
    const panelY = mobile ? 150 : 210;

    const container = this.add.container(width / 2, panelY);

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    bg.lineStyle(2, correct ? 0x00ff00 : 0xff4444, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    container.add(bg);

    // Build explanation text
    const accusedName = this.data?.accusedName ?? 'Unknown';
    const guiltyName = this.data?.guiltyName ?? 'Unknown';
    const evidence = this.data?.evidence ?? [];

    let headerText: string;
    let detailText: string;

    if (correct) {
      headerText = `You caught ${accusedName}!`;
      const evidenceList = evidence.slice(0, 3).map(e => `• ${e}`).join('\n');
      detailText = `Key Evidence:\n${evidenceList}`;
    } else {
      headerText = `${accusedName} was innocent.`;
      const evidenceList = evidence.slice(0, 3).map(e => `• ${e}`).join('\n');
      detailText = `The killer: ${guiltyName}\n${evidenceList}`;
    }

    container.add(this.add.text(0, 15, headerText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(11)}px`,
      color: '#ffffff',
      resolution: 2,
    }).setOrigin(0.5));

    container.add(this.add.text(0, panelHeight / 2 + 10, detailText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(9)}px`,
      color: '#aaaaaa',
      align: 'center',
      lineSpacing: 3,
      resolution: 2,
    }).setOrigin(0.5));
  }

  private createStatsPanel(width: number, height: number, mobile: boolean): void {
    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 50 : 60;
    const panelY = mobile ? 265 : 350;

    const container = this.add.container(width / 2, panelY);

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f3460, 0.7);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 6);
    bg.lineStyle(1, 0xffd700, 0.3);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 6);
    container.add(bg);

    const progress = this.data?.progress;
    const currentCase = this.data?.currentCase;
    const cluesFound = progress?.cluesFound.length ?? 0;
    const totalClues = currentCase?.clues.length ?? 0;
    const suspectsInterrogated = progress?.suspectsInterrogated.length ?? 0;
    const totalSuspects = currentCase?.suspects.length ?? 0;

    // Stats text
    const statsText = `Clues: ${cluesFound}/${totalClues}  |  Interrogated: ${suspectsInterrogated}/${totalSuspects}`;
    container.add(this.add.text(0, panelHeight / 2, statsText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(10)}px`,
      color: '#ffd700',
      resolution: 2,
    }).setOrigin(0.5));
  }

  private createPlayAgainButton(width: number, height: number, mobile: boolean): void {
    const btnY = height - (mobile ? 40 : 60);

    const btn = this.add.text(width / 2, btnY, '[RETURN TO MENU]', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(12)}px`,
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 8 },
      resolution: 2,
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setStyle({ backgroundColor: '#444444', color: '#ffff00' }))
      .on('pointerout', () => btn.setStyle({ backgroundColor: '#333333', color: '#ffffff' }))
      .on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
