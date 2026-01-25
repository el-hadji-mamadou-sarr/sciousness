import { Scene, GameObjects } from 'phaser';
import { Case, PlayerProgress, LeaderboardStats, LeaderboardResponse } from '../../../shared/types/game';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';

interface GameOverData {
  correct: boolean;
  accusedName: string;
  guiltyName: string;
  evidence: string[];
  currentCase: Case | null;
  progress: PlayerProgress | null;
}

export class GameOver extends Scene {
  private gameData: GameOverData | null = null;
  private leaderboard: LeaderboardStats | null = null;
  private leaderboardContainer: GameObjects.Container | null = null;

  constructor() {
    super('GameOver');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  init(data: GameOverData) {
    this.gameData = data;
    this.leaderboard = null;
  }

  async create() {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const correct = this.gameData?.correct ?? false;

    this.cameras.main.setBackgroundColor(correct ? 0x0a1a0a : 0x1a0a0a);
    this.createScanlines(width, height);

    const glowColor = correct ? 0x00ff00 : 0xff0000;
    const glow = this.add.graphics();
    glow.fillStyle(glowColor, 0.03);
    glow.fillCircle(width / 2, height / 3, mobile ? 120 : 180);

    this.createResultBadge(width, mobile, correct);
    this.createCaseInfo(width, mobile);
    this.createExplanationPanel(width, height, mobile, correct);
    this.createPlayerStatsPanel(width, height, mobile);
    await this.loadAndCreateLeaderboard(width, height, mobile);
    this.createPlayAgainButton(width, height, mobile);

    this.scale.on('resize', () => this.scene.restart(this.gameData ?? undefined));
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
    const badgeY = mobile ? 35 : 50;
    const badgeSize = mobile ? 40 : 55;

    const badge = this.add.graphics();
    badge.lineStyle(3, correct ? 0x00ff00 : 0xff0000, 1);
    badge.strokeCircle(width / 2, badgeY, badgeSize);
    badge.lineStyle(1, correct ? 0x00ff00 : 0xff0000, 0.3);
    badge.strokeCircle(width / 2, badgeY, badgeSize + 6);

    const icon = correct ? 'V' : 'X';
    createNoirText(this, width / 2, badgeY, icon, {
      size: 'xlarge',
      color: correct ? 'green' : 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    const titleY = badgeY + badgeSize + (mobile ? 15 : 22);
    const titleText = correct ? 'CASE SOLVED' : 'CASE FAILED';
    createNoirText(this, width / 2, titleY, titleText, {
      size: 'xlarge',
      color: correct ? 'green' : 'red',
      origin: { x: 0.5, y: 0.5 },
    });
  }

  private createCaseInfo(width: number, mobile: boolean): void {
    const caseTitle = this.gameData?.currentCase?.title ?? 'UNKNOWN CASE';
    const y = mobile ? 115 : 150;

    createNoirText(this, width / 2, y, caseTitle.toUpperCase(), {
      size: 'medium',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });
  }

  private createExplanationPanel(width: number, height: number, mobile: boolean, correct: boolean): void {
    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 140 : 150;
    const panelY = mobile ? 135 : 175;

    const container = this.add.container(width / 2, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    bg.lineStyle(2, correct ? 0x00ff00 : 0xff4444, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    container.add(bg);

    const accusedName = this.gameData?.accusedName ?? 'Unknown';
    const guiltyName = this.gameData?.guiltyName ?? 'Unknown';
    const evidence = this.gameData?.evidence ?? [];

    let headerText: string;
    let detailText: string;

    if (correct) {
      headerText = `YOU CAUGHT ${accusedName.toUpperCase()}!`;
      const evidenceList = evidence.map(e => `- ${e.toUpperCase()}`).join('\n');
      detailText = `KEY EVIDENCE:\n${evidenceList}`;
    } else {
      headerText = `${accusedName.toUpperCase()} WAS INNOCENT.`;
      const evidenceList = evidence.map(e => `- ${e.toUpperCase()}`).join('\n');
      detailText = `THE KILLER: ${guiltyName.toUpperCase()}\n${evidenceList}`;
    }

    container.add(createNoirText(this, 0, 18, headerText, {
      size: 'medium',
      color: 'white',
      origin: { x: 0.5, y: 0 },
    }));

    // Detail text
    container.add(createNoirText(this, 0, 48, detailText, {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0 },
      maxWidth: panelWidth - 30,
    }));
  }

  private createPlayerStatsPanel(width: number, height: number, mobile: boolean): void {
    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 55 : 60;
    const panelY = mobile ? 255 : 310;

    const container = this.add.container(width / 2, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f3460, 0.7);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 6);
    bg.lineStyle(1, 0xffd700, 0.3);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 6);
    container.add(bg);

    const progress = this.gameData?.progress;
    const currentCase = this.gameData?.currentCase;
    const cluesFound = progress?.cluesFound.length ?? 0;
    const totalClues = currentCase?.clues.length ?? 0;
    const suspectsInterrogated = progress?.suspectsInterrogated.length ?? 0;
    const totalSuspects = currentCase?.suspects.length ?? 0;

    const statsText = `CLUES: ${cluesFound}/${totalClues}  |  INTERROGATED: ${suspectsInterrogated}/${totalSuspects}`;
    container.add(createNoirText(this, 0, panelHeight / 2, statsText, {
      size: 'medium',
      color: 'gold',
      origin: { x: 0.5, y: 0.5 },
    }));
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
      this.createLeaderboardFallback(width, height, mobile);
    }
  }

  private createLeaderboardPanel(width: number, height: number, mobile: boolean): void {
    if (!this.leaderboard) return;

    const panelWidth = width - (mobile ? 30 : 60);
    const panelHeight = mobile ? 125 : 140;
    const panelY = mobile ? 320 : 385;

    this.leaderboardContainer = this.add.container(width / 2, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    bg.lineStyle(2, 0x6c5ce7, 0.6);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 8);
    this.leaderboardContainer.add(bg);

    this.leaderboardContainer.add(createNoirText(this, 0, 14, 'COMMUNITY STATS', {
      size: 'medium',
      color: 'cyan',
      origin: { x: 0.5, y: 0 },
    }));

    const totalText = `${this.leaderboard.totalPlayers} DETECTIVES PLAYED`;
    const solveText = `${this.leaderboard.solveRate}% SOLVE RATE (${this.leaderboard.solvedCount} SOLVED)`;

    this.leaderboardContainer.add(createNoirText(this, 0, mobile ? 42 : 48, totalText, {
      size: 'small',
      color: 'white',
      origin: { x: 0.5, y: 0 },
    }));

    this.leaderboardContainer.add(createNoirText(this, 0, mobile ? 62 : 70, solveText, {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0 },
    }));

    if (this.leaderboard.suspectStats.length > 0) {
      const suspectLines = this.leaderboard.suspectStats.map(s => {
        const bar = this.createPercentageBar(s.percentage);
        return `${s.suspectName.substring(0, mobile ? 10 : 16).toUpperCase()}: ${bar} ${s.percentage}%`;
      }).join('\n');

      this.leaderboardContainer.add(createNoirText(this, 0, mobile ? 88 : 100, suspectLines, {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0 },
        align: 0,
        scale: 0.9,
      }));
    }
  }

  private createPercentageBar(percentage: number): string {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '#'.repeat(filled) + '-'.repeat(empty);
  }

  private createLeaderboardFallback(width: number, height: number, mobile: boolean): void {
    const panelY = mobile ? 270 : 335;

    this.leaderboardContainer = this.add.container(width / 2, panelY);

    this.leaderboardContainer.add(createNoirText(this, 0, 20, 'COMMUNITY STATS LOADING...', {
      size: 'small',
      color: 'darkGray',
      origin: { x: 0.5, y: 0 },
    }));
  }

  private createPlayAgainButton(width: number, height: number, mobile: boolean): void {
    const btnY = height - (mobile ? 30 : 50);

    createNoirButton(this, width / 2, btnY, '[RETURN TO MENU]', {
      size: 'medium',
      color: 'white',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'MainMenu'),
      padding: { x: 20, y: 10 },
    });
  }
}
