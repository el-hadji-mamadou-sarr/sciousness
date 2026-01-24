import * as Phaser from 'phaser';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
type FontColor = 'white' | 'red' | 'gold' | 'green' | 'cyan' | 'gray' | 'darkGray' | 'lightGray';

// Font family - JetBrains Mono for crisp rendering
const FONT_FAMILY = '"JetBrains Mono", "Fira Code", "Source Code Pro", "Consolas", monospace';

// Color mapping
const COLORS: Record<FontColor, string> = {
  white: '#FFFFFF',
  red: '#FF4444',
  gold: '#FFD700',
  green: '#00FF00',
  cyan: '#00FFFF',
  gray: '#888888',
  darkGray: '#666666',
  lightGray: '#CCCCCC',
};

// Base font sizes - balanced for readability and fit
const FONT_SIZES: Record<FontSize, number> = {
  small: 14,
  medium: 18,
  large: 24,
  xlarge: 32,
};

interface NoirTextConfig {
  size?: FontSize;
  color?: FontColor;
  origin?: { x: number; y: number };
  maxWidth?: number;
  align?: number; // 0 = left, 1 = center, 2 = right
  scale?: number;
}

/**
 * Disable pixel rounding for better thin stroke rendering
 */
export function configureRendererForFonts(game: Phaser.Game): void {
  if (game.renderer && game.renderer.config) {
    (game.renderer.config as { roundPixels: boolean }).roundPixels = false;
  }
}

/**
 * Get responsive font size based on screen width
 */
function getResponsiveSize(scene: Phaser.Scene, baseSize: FontSize): number {
  const screenWidth = scene.scale.width;
  const basePx = FONT_SIZES[baseSize];

  // Scale font based on screen width
  if (screenWidth < 400) {
    return Math.max(basePx * 0.85, 12);
  }
  if (screenWidth < 600) {
    return Math.max(basePx * 0.95, 13);
  }
  return basePx;
}

/**
 * Creates crisp text optimized for the noir game style
 * Uses resolution: 2 for crisp rendering on all devices
 */
export function createNoirText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  config: NoirTextConfig = {}
): Phaser.GameObjects.Text {
  const size = config.size || 'medium';
  const color = config.color || 'white';
  const fontSize = getResponsiveSize(scene, size);

  const alignMap = ['left', 'center', 'right'] as const;
  const textAlign = alignMap[config.align ?? 0] ?? 'left';

  const textObj = scene.add.text(x, y, text.toUpperCase(), {
    fontFamily: FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color: COLORS[color],
    align: textAlign,
    resolution: 2, // Critical for crisp text on mobile
    wordWrap: config.maxWidth ? { width: config.maxWidth } : undefined,
  });

  if (config.origin) {
    textObj.setOrigin(config.origin.x, config.origin.y);
  }

  if (config.scale) {
    textObj.setScale(config.scale);
  }

  return textObj;
}

/**
 * Creates an interactive button with text
 */
export function createNoirButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  config: {
    size?: FontSize;
    color?: FontColor;
    hoverColor?: FontColor;
    onClick?: () => void;
    padding?: { x: number; y: number };
  } = {}
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const size = config.size || 'medium';
  const color = config.color || 'green';
  const hoverColor = config.hoverColor || 'cyan';
  const padding = config.padding || { x: 15, y: 8 };
  const fontSize = getResponsiveSize(scene, size);

  // Create text
  const buttonText = scene.add.text(0, 0, text.toUpperCase(), {
    fontFamily: FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color: COLORS[color],
    resolution: 2,
  });
  buttonText.setOrigin(0.5);

  // Calculate button size
  const btnWidth = buttonText.width + padding.x * 2;
  const btnHeight = buttonText.height + padding.y * 2;

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a2e, 1);
  bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
  bg.lineStyle(1, 0x394867, 1);
  bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);

  container.add([bg, buttonText]);

  // Make interactive
  container.setSize(btnWidth, btnHeight);
  container.setInteractive({ useHandCursor: true });

  container.on('pointerover', () => {
    buttonText.setColor(COLORS[hoverColor]);
    bg.clear();
    bg.fillStyle(0x2a2a4e, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
    bg.lineStyle(1, 0x495887, 1);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
  });

  container.on('pointerout', () => {
    buttonText.setColor(COLORS[color]);
    bg.clear();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
    bg.lineStyle(1, 0x394867, 1);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
  });

  if (config.onClick) {
    container.on('pointerdown', config.onClick);
  }

  return container;
}

/**
 * Check if device is mobile based on screen width
 */
export function isMobileScreen(scene: Phaser.Scene): boolean {
  return scene.scale.width < 500;
}
