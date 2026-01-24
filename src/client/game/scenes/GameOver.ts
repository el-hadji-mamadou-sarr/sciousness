import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, LeaderboardStats, LeaderboardResponse } from '../../../shared/types/game';

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
  private leaderboard: LeaderboardStats | null = null;
  private leaderboardContainer: GameObjects.Container | null = null;

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
    this.leaderboard = null;
  }

  async create() {
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

    // Player stats panel
    this.createPlayerStatsPanel(width, height, mobile);

    // Leaderboard panel (loads async)
    await this.loadAndCreateLeaderboard(width, height, mobile);

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
    const badgeY = mobile ? 30 : 45;
    const badgeSize = mobile ? 35 : 50;

    // Badge circle
    const badge = this.add.graphics();
    badge.lineStyle(3, correct ? 0x00ff00 : 0xff0000, 1);
    badge.strokeCircle(width / 2, badgeY, badgeSize);
    badge.lineStyle(1, correct ? 0x00ff00 : 0xff0000, 0.3);
    badge.strokeCircle(width / 2, badgeY, badgeSize + 6);

    // Result icon
    const icon = correct ? '✓' : '✗';
    this.add.text(width / 2, badgeY, icon, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(24)}px`,
      color: correct ? '#00ff00' : '#ff0000',
      resolution: 2,
    }).setOrigin(0.5);

    // Title text
    const titleY = badgeY + badgeSize + (mobile ? 10 : 15);
    const titleText = correct ? 'CASE SOLVED' : 'CASE FAILED';
    this.add.text(width / 2, titleY, titleText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(16)}px`,
      color: correct ? '#00ff00' : '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
      resolution: 2,
    }).setOrigin(0.5);
  }

  private createCaseInfo(width: number, mobile: boolean): void {
    const caseTitle = this.data?.currentCase?.title ?? 'Unknown Case';
    const y = mobile ? 95 : 130;

    this.add.text(width / 2, y, caseTitle, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(9)}px`,
      color: '#888888',
      resolution: 2,
    }).setOrigin(0.5);
  }

  private createExplanationPanel(width: number, height: number, mobile: boolean, correct: boolean): void {
    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 80 : 95;
    const panelY = mobile ? 110 : 150;

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
      const evidenceList = evidence.slice(0, 2).map(e => `• ${e}`).join('\n');
      detailText = `Key Evidence:\n${evidenceList}`;
    } else {
      headerText = `${accusedName} was innocent.`;
      const evidenceList = evidence.slice(0, 2).map(e => `• ${e}`).join('\n');
      detailText = `The killer: ${guiltyName}\n${evidenceList}`;
    }

    container.add(this.add.text(0, 12, headerText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(10)}px`,
      color: '#ffffff',
      resolution: 2,
    }).setOrigin(0.5));

    container.add(this.add.text(0, panelHeight / 2 + 8, detailText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(8)}px`,
      color: '#aaaaaa',
      align: 'center',
      lineSpacing: 2,
      resolution: 2,
    }).setOrigin(0.5));
  }

  private createPlayerStatsPanel(width: number, height: number, mobile: boolean): void {
    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 45 : 50;
    const panelY = mobile ? 200 : 260;

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

    // Stats text - larger for mobile
    const statsText = `Clues: ${cluesFound}/${totalClues}  |  Interrogated: ${suspectsInterrogated}/${totalSuspects}`;
    container.add(this.add.text(0, panelHeight / 2, statsText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(12)}px`,
      color: '#ffd700',
      resolution: 2,
    }).setOrigin(0.5));
  }

  private async loadAndCreateLeaderboard(width: number, height: number, mobile: boolean): Promise<void> {
    try {
      const response = await fetch('/api/game/leaderboard');
      if (response.ok) {
        const data = (await response.json()) as LeaderboardResponse;
        this.leaderboard = data.stats;
        this.createLeaderboardPanel(width, height, mobile);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Show fallback message
      this.createLeaderboardFallback(width, height, mobile);
    }
  }

  private createLeaderboardPanel(width: number, height: number, mobile: boolean): void {
    if (!this.leaderboard) return;

    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 115 : 130;
    const panelY = mobile ? 255 : 325;

    this.leaderboardContainer = this.add.container(width / 2, panelY);

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    bg.lineStyle(2, 0x6c5ce7, 0.6);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    this.leaderboardContainer.add(bg);

    // Title - larger
    this.leaderboardContainer.add(this.add.text(0, 14, ' COMMUNITY STATS', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(13)}px`,
      color: '#6c5ce7',
      resolution: 2,
    }).setOrigin(0.5));

    // Total players and solve rate - larger fonts
    const totalText = `${this.leaderboard.totalPlayers} detectives played`;
    const solveText = `${this.leaderboard.solveRate}% solve rate (${this.leaderboard.solvedCount} solved)`;

    this.leaderboardContainer.add(this.add.text(0, mobile ? 35 : 40, totalText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(11)}px`,
      color: '#ffffff',
      resolution: 2,
    }).setOrigin(0.5));

    this.leaderboardContainer.add(this.add.text(0, mobile ? 52 : 58, solveText, {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(10)}px`,
      color: '#aaaaaa',
      resolution: 2,
    }).setOrigin(0.5));

    // Suspect accusation breakdown - larger fonts
    if (this.leaderboard.suspectStats.length > 0) {
      const suspectLines = this.leaderboard.suspectStats.map(s => {
        const bar = this.createPercentageBar(s.percentage);
        return `${s.suspectName.substring(0, mobile ? 10 : 16)}: ${bar} ${s.percentage}%`;
      }).join('\n');

      this.leaderboardContainer.add(this.add.text(0, mobile ? 82 : 95, suspectLines, {
        fontFamily: 'Courier New',
        fontSize: `${this.getFontSize(9)}px`,
        color: '#888888',
        align: 'left',
        lineSpacing: 4,
        resolution: 2,
      }).setOrigin(0.5));
    }
  }

  private createPercentageBar(percentage: number): string {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private createLeaderboardFallback(width: number, height: number, mobile: boolean): void {
    const panelY = mobile ? 255 : 325;

    this.leaderboardContainer = this.add.container(width / 2, panelY);

    this.leaderboardContainer.add(this.add.text(0, 20, 'Community stats loading...', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(11)}px`,
      color: '#555555',
      resolution: 2,
    }).setOrigin(0.5));
  }

  private createPlayAgainButton(width: number, height: number, mobile: boolean): void {
    const btnY = height - (mobile ? 25 : 40);

    const btn = this.add.text(width / 2, btnY, '[RETURN TO MENU]', {
      fontFamily: 'Courier New',
      fontSize: `${this.getFontSize(11)}px`,
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 12, y: 6 },
      resolution: 2,
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setStyle({ backgroundColor: '#444444', color: '#ffff00' }))
      .on('pointerout', () => btn.setStyle({ backgroundColor: '#333333', color: '#ffffff' }))
      .on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
