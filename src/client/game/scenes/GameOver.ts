import { Scene, GameObjects } from 'phaser';
import {
  Case,
  PlayerProgress,
  DetectiveLeaderboardEntry,
  DetectiveLeaderboardResponse,
  DetectiveProfile,
} from '../../../shared/types/game';
import { transitionToScene } from '../utils/SceneTransition';
import { createNoirText, createNoirButton, isMobileScreen } from '../utils/NoirText';

interface GameOverData {
  correct: boolean;
  accusedName: string;
  guiltyName: string;
  evidence: string[];
  currentCase: Case | null;
  progress: PlayerProgress | null;
  pointsEarned?: number;
  totalPoints?: number;
  alreadySolved?: boolean;
}

export class GameOver extends Scene {
  private gameData: GameOverData | null = null;
  private topDetectives: DetectiveLeaderboardEntry[] = [];
  private userProfile: DetectiveProfile | null = null;
  private userRank: number | undefined;

  constructor() {
    super('GameOver');
  }

  private isMobile(): boolean {
    return isMobileScreen(this);
  }

  init(data: GameOverData) {
    this.gameData = data;
    this.topDetectives = [];
    this.userProfile = null;
    this.userRank = undefined;
  }

  async create() {
    const { width, height } = this.scale;
    const mobile = this.isMobile();
    const correct = this.gameData?.correct ?? false;

    this.cameras.main.setBackgroundColor(0x0a0a14);
    this.createBackground(width, height, correct);

    if (mobile) {
      this.createMobileLayout(width, height, correct);
    } else {
      this.createDesktopLayout(width, height, correct);
    }

    await this.loadLeaderboard();

    if (mobile) {
      this.createMobileStats(width, height);
    } else {
      this.createDesktopStats(width, height);
    }

    this.createFooter(width, height, mobile);
    this.scale.on('resize', () => this.scene.restart(this.gameData ?? undefined));
  }

  private createBackground(width: number, height: number, correct: boolean): void {
    // Scanlines
    const graphics = this.add.graphics();
    const spacing = this.isMobile() ? 5 : 3;
    graphics.lineStyle(1, 0x000000, 0.15);
    for (let y = 0; y < height; y += spacing) {
      graphics.lineBetween(0, y, width, y);
    }

    // Ambient glow
    const glowColor = correct ? 0x00ff00 : 0xff0000;
    const glow = this.add.graphics();
    glow.fillStyle(glowColor, 0.02);
    glow.fillCircle(width * 0.3, height * 0.3, 300);
    glow.fillCircle(width * 0.7, height * 0.6, 250);

    // Corner decorations
    this.createCornerDecoration(20, 20, correct);
    this.createCornerDecoration(width - 20, 20, correct, true);
    this.createCornerDecoration(20, height - 20, correct, false, true);
    this.createCornerDecoration(width - 20, height - 20, correct, true, true);
  }

  private createCornerDecoration(x: number, y: number, correct: boolean, flipX = false, flipY = false): void {
    const g = this.add.graphics();
    const color = correct ? 0x00ff00 : 0xff4444;
    const size = 30;
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;

    g.lineStyle(2, color, 0.4);
    g.beginPath();
    g.moveTo(x, y + sy * size);
    g.lineTo(x, y);
    g.lineTo(x + sx * size, y);
    g.strokePath();

    g.lineStyle(1, color, 0.2);
    g.beginPath();
    g.moveTo(x, y + sy * (size - 10));
    g.lineTo(x + sx * (size - 10), y);
    g.strokePath();
  }

  private createMobileLayout(width: number, height: number, correct: boolean): void {
    const accusedName = this.gameData?.accusedName ?? 'Unknown';
    const guiltyName = this.gameData?.guiltyName ?? 'Unknown';

    // Result badge
    const badgeY = 50;
    this.createResultBadge(width / 2, badgeY, 40, correct);

    // Title
    const titleY = badgeY + 60;
    createNoirText(this, width / 2, titleY, correct ? 'CASE SOLVED' : 'CASE FAILED', {
      size: 'xlarge',
      color: correct ? 'green' : 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    // Case name
    const caseTitle = this.gameData?.currentCase?.title ?? 'UNKNOWN CASE';
    createNoirText(this, width / 2, titleY + 35, caseTitle.toUpperCase(), {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    // Explanation panel
    this.createExplanationPanel(width / 2, titleY + 90, width - 30, 90, correct, accusedName, guiltyName);
  }

  private createDesktopLayout(width: number, height: number, correct: boolean): void {
    const accusedName = this.gameData?.accusedName ?? 'Unknown';
    const guiltyName = this.gameData?.guiltyName ?? 'Unknown';

    // Left side - Result
    const leftX = width * 0.3;
    const centerY = height * 0.35;

    // Large result badge
    this.createResultBadge(leftX, centerY - 30, 70, correct);

    // Title below badge
    createNoirText(this, leftX, centerY + 60, correct ? 'CASE SOLVED' : 'CASE FAILED', {
      size: 'xlarge',
      color: correct ? 'green' : 'red',
      origin: { x: 0.5, y: 0.5 },
    });

    // Case name
    const caseTitle = this.gameData?.currentCase?.title ?? 'UNKNOWN CASE';
    createNoirText(this, leftX, centerY + 100, caseTitle.toUpperCase(), {
      size: 'medium',
      color: 'gray',
      origin: { x: 0.5, y: 0.5 },
    });

    // Right side - Explanation panel
    const rightX = width * 0.7;
    this.createExplanationPanel(rightX, centerY, 400, 160, correct, accusedName, guiltyName);

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(1, correct ? 0x00ff00 : 0xff4444, 0.3);
    divider.lineBetween(width / 2, height * 0.1, width / 2, height * 0.55);
  }

  private createResultBadge(x: number, y: number, size: number, correct: boolean): void {
    const badge = this.add.graphics();
    const color = correct ? 0x00ff00 : 0xff0000;

    // Outer glow
    badge.fillStyle(color, 0.1);
    badge.fillCircle(x, y, size + 15);

    // Main circle
    badge.lineStyle(4, color, 1);
    badge.strokeCircle(x, y, size);

    // Inner ring
    badge.lineStyle(1, color, 0.4);
    badge.strokeCircle(x, y, size - 8);

    // Icon
    const icon = correct ? 'V' : 'X';
    createNoirText(this, x, y, icon, {
      size: 'xlarge',
      color: correct ? 'green' : 'red',
      origin: { x: 0.5, y: 0.5 },
    });
  }

  private createExplanationPanel(
    x: number,
    y: number,
    panelWidth: number,
    panelHeight: number,
    correct: boolean,
    accusedName: string,
    guiltyName: string
  ): void {
    const container = this.add.container(x, y);

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 10);
    bg.lineStyle(2, correct ? 0x00ff00 : 0xff4444, 0.6);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 10);
    container.add(bg);

    // Inner decoration
    bg.lineStyle(1, correct ? 0x00ff00 : 0xff4444, 0.15);
    bg.strokeRoundedRect(-panelWidth / 2 + 8, -panelHeight / 2 + 8, panelWidth - 16, panelHeight - 16, 6);

    if (correct) {
      container.add(createNoirText(this, 0, -panelHeight / 3, 'YOU CAUGHT THE KILLER', {
        size: 'medium',
        color: 'white',
        origin: { x: 0.5, y: 0.5 },
      }));

      container.add(createNoirText(this, 0, 0, accusedName.toUpperCase(), {
        size: 'large',
        color: 'green',
        origin: { x: 0.5, y: 0.5 },
      }));

      // Show points earned
      const pointsEarned = this.gameData?.pointsEarned ?? 0;
      const alreadySolved = this.gameData?.alreadySolved ?? false;
      const pointsText = alreadySolved ? 'ALREADY SOLVED' : `+${pointsEarned} POINTS`;
      const pointsColor = alreadySolved ? 'gray' : 'gold';

      container.add(createNoirText(this, 0, panelHeight / 3, pointsText, {
        size: 'medium',
        color: pointsColor,
        origin: { x: 0.5, y: 0.5 },
      }));
    } else {
      container.add(createNoirText(this, 0, -panelHeight / 3, 'WRONG ACCUSATION', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      }));

      container.add(createNoirText(this, 0, -panelHeight / 6, `${accusedName.toUpperCase()} WAS INNOCENT`, {
        size: 'medium',
        color: 'white',
        origin: { x: 0.5, y: 0.5 },
      }));

      container.add(createNoirText(this, 0, panelHeight / 8, 'THE REAL KILLER:', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0.5 },
      }));

      container.add(createNoirText(this, 0, panelHeight / 3, guiltyName.toUpperCase(), {
        size: 'large',
        color: 'red',
        origin: { x: 0.5, y: 0.5 },
      }));
    }
  }

  private async loadLeaderboard(): Promise<void> {
    try {
      const response = await fetch('/api/game/detective-leaderboard');

      if (response.ok) {
        const data = (await response.json()) as DetectiveLeaderboardResponse;
        this.topDetectives = data.topDetectives;
        this.userProfile = data.userProfile || null;
        this.userRank = data.userRank;
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }

  private createMobileStats(width: number, height: number): void {
    const panelY = 310;
    const panelWidth = width - 30;
    const panelHeight = 200;

    this.createStatsPanel(width / 2, panelY, panelWidth, panelHeight, true);
  }

  private createDesktopStats(width: number, height: number): void {
    const panelY = height * 0.72;
    const panelWidth = Math.min(900, width - 100);
    const panelHeight = 180;

    this.createStatsPanel(width / 2, panelY, panelWidth, panelHeight, false);
  }

  private createStatsPanel(x: number, y: number, panelWidth: number, panelHeight: number, mobile: boolean): void {
    const container = this.add.container(x, y);

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 10);
    bg.lineStyle(2, 0x6c5ce7, 0.5);
    bg.strokeRoundedRect(-panelWidth / 2, 0, panelWidth, panelHeight, 10);
    container.add(bg);

    // Header
    container.add(createNoirText(this, 0, 18, 'TOP DETECTIVES', {
      size: 'large',
      color: 'gold',
      origin: { x: 0.5, y: 0 },
    }));

    // Decorative line under header
    const headerLine = this.add.graphics();
    headerLine.lineStyle(1, 0x6c5ce7, 0.4);
    headerLine.lineBetween(-panelWidth / 3, 45, panelWidth / 3, 45);
    container.add(headerLine);

    if (this.topDetectives.length === 0 && !this.userProfile) {
      container.add(createNoirText(this, 0, panelHeight / 2, 'LOADING...', {
        size: 'medium',
        color: 'darkGray',
        origin: { x: 0.5, y: 0.5 },
      }));
      return;
    }

    if (mobile) {
      this.createMobileStatsContent(container, panelWidth, panelHeight);
    } else {
      this.createDesktopStatsContent(container, panelWidth, panelHeight);
    }
  }

  private createMobileStatsContent(container: GameObjects.Container, panelWidth: number, _panelHeight: number): void {
    // Show user's stats
    if (this.userProfile) {
      container.add(createNoirText(this, 0, 55, `YOUR POINTS: ${this.userProfile.points}`, {
        size: 'medium',
        color: 'gold',
        origin: { x: 0.5, y: 0 },
      }));

      const rankText = this.userRank ? `RANK #${this.userRank}` : '';
      if (rankText) {
        container.add(createNoirText(this, 0, 78, rankText, {
          size: 'small',
          color: 'cyan',
          origin: { x: 0.5, y: 0 },
        }));
      }
    }

    // Top detectives list
    const startY = this.userProfile ? 105 : 60;
    const rowWidth = panelWidth - 40;

    this.topDetectives.slice(0, 4).forEach((detective, i) => {
      this.createDetectiveRow(container, 0, startY + i * 22, i + 1, detective.username, detective.points, rowWidth, true);
    });
  }

  private createDesktopStatsContent(container: GameObjects.Container, panelWidth: number, panelHeight: number): void {
    // Left side - User stats
    const leftX = -panelWidth / 4;

    if (this.userProfile) {
      container.add(createNoirText(this, leftX, 60, `${this.userProfile.points}`, {
        size: 'xlarge',
        color: 'gold',
        origin: { x: 0.5, y: 0 },
      }));
      container.add(createNoirText(this, leftX, 95, 'YOUR POINTS', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0 },
      }));

      const casesText = `${this.userProfile.solvedCases.length} CASES SOLVED`;
      container.add(createNoirText(this, leftX, 120, casesText, {
        size: 'small',
        color: 'cyan',
        origin: { x: 0.5, y: 0 },
      }));

      if (this.userRank) {
        container.add(createNoirText(this, leftX, 145, `RANK #${this.userRank}`, {
          size: 'medium',
          color: 'white',
          origin: { x: 0.5, y: 0 },
        }));
      }
    } else {
      container.add(createNoirText(this, leftX, 80, 'SIGN IN TO', {
        size: 'small',
        color: 'gray',
        origin: { x: 0.5, y: 0 },
      }));
      container.add(createNoirText(this, leftX, 105, 'TRACK POINTS', {
        size: 'medium',
        color: 'white',
        origin: { x: 0.5, y: 0 },
      }));
    }

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x6c5ce7, 0.3);
    divider.lineBetween(0, 55, 0, panelHeight - 15);
    container.add(divider);

    // Right side - Top detectives
    const rightX = panelWidth / 4;
    container.add(createNoirText(this, rightX, 55, 'LEADERBOARD', {
      size: 'small',
      color: 'gray',
      origin: { x: 0.5, y: 0 },
    }));

    const rowWidth = panelWidth / 2 - 40;
    const startY = 80;
    this.topDetectives.slice(0, 4).forEach((detective, i) => {
      this.createDetectiveRow(container, rightX, startY + i * 24, i + 1, detective.username, detective.points, rowWidth, false);
    });
  }

  private createDetectiveRow(
    container: GameObjects.Container,
    x: number,
    y: number,
    rank: number,
    username: string,
    points: number,
    maxWidth: number,
    mobile: boolean
  ): void {
    // Rank with medal color for top 3
    const rankColor = rank === 1 ? 'gold' : rank === 2 ? 'white' : rank === 3 ? 'cyan' : 'gray';
    container.add(createNoirText(this, x - maxWidth / 2, y, `#${rank}`, {
      size: 'small',
      color: rankColor,
      origin: { x: 0, y: 0 },
    }));

    // Username
    const maxNameLen = mobile ? 10 : 14;
    const displayName = username.length > maxNameLen ? username.substring(0, maxNameLen) + '...' : username;
    container.add(createNoirText(this, x - maxWidth / 2 + 35, y, displayName.toUpperCase(), {
      size: 'small',
      color: 'white',
      origin: { x: 0, y: 0 },
    }));

    // Points on right
    container.add(createNoirText(this, x + maxWidth / 2, y, `${points} PTS`, {
      size: 'small',
      color: rankColor,
      origin: { x: 1, y: 0 },
    }));
  }

  private createFooter(width: number, height: number, mobile: boolean): void {
    const btnY = height - (mobile ? 35 : 50);

    createNoirButton(this, width / 2, btnY, '[RETURN TO MENU]', {
      size: 'medium',
      color: 'white',
      hoverColor: 'gold',
      onClick: () => transitionToScene(this, 'MainMenu'),
      padding: { x: 25, y: 12 },
    });
  }
}
