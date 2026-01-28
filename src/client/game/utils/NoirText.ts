import * as Phaser from 'phaser';
import { getSafeBitmapFontName } from './BitmapFontLoader';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
type FontColor = 'white' | 'red' | 'gold' | 'green' | 'cyan' | 'gray' | 'darkGray' | 'lightGray';

// Map extended colors to bitmap font colors
const BITMAP_COLOR_MAP: Record<FontColor, 'white' | 'red' | 'gold' | 'green' | 'cyan' | 'gray'> = {
  white: 'white',
  red: 'red',
  gold: 'gold',
  green: 'green',
  cyan: 'cyan',
  gray: 'gray',
  darkGray: 'gray',
  lightGray: 'white',
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
 * Creates crisp bitmap text optimized for the noir game style
 */
export function createNoirText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  config: NoirTextConfig = {}
): Phaser.GameObjects.BitmapText {
  const size = config.size || 'medium';
  const color = config.color || 'white';
  const bitmapColor = BITMAP_COLOR_MAP[color];

  // Get safe bitmap font name (with fallback)
  const fontName = getSafeBitmapFontName(scene, size, bitmapColor);

  const textObj = scene.add.bitmapText(x, y, fontName, text.toUpperCase());

  // Handle alignment via origin
  if (config.align === 1) {
    // Center
    textObj.setOrigin(0.5, 0);
  } else if (config.align === 2) {
    // Right
    textObj.setOrigin(1, 0);
  }

  if (config.origin) {
    textObj.setOrigin(config.origin.x, config.origin.y);
  }

  if (config.scale) {
    textObj.setScale(config.scale);
  }

  // Handle max width with word wrap
  if (config.maxWidth) {
    textObj.setMaxWidth(config.maxWidth);
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

  const bitmapColor = BITMAP_COLOR_MAP[color];
  const bitmapHoverColor = BITMAP_COLOR_MAP[hoverColor];

  // Get bitmap font names
  const fontName = getSafeBitmapFontName(scene, size, bitmapColor);
  const hoverFontName = getSafeBitmapFontName(scene, size, bitmapHoverColor);

  // Create bitmap text
  const buttonText = scene.add.bitmapText(0, 0, fontName, text.toUpperCase());
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
    buttonText.setFont(hoverFontName);
    bg.clear();
    bg.fillStyle(0x2a2a4e, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
    bg.lineStyle(1, 0x495887, 1);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
  });

  container.on('pointerout', () => {
    buttonText.setFont(fontName);
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
  return scene.scale.width < 768;
}

/**
 * Creates a scrollable text box with mask
 */
export function createScrollableTextBox(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  config: NoirTextConfig = {}
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  // Create the text content
  const textObj = createNoirText(scene, 0, 0, text, {
    ...config,
    origin: { x: 0, y: 0 },
    maxWidth: width - 20,
  });

  // Content container that will scroll
  const contentContainer = scene.add.container(10, 5);
  contentContainer.add(textObj);

  // Create mask shape
  const maskShape = scene.make.graphics({ x: 0, y: 0 });
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(x, y, width, height);

  const mask = maskShape.createGeometryMask();
  contentContainer.setMask(mask);

  container.add(contentContainer);

  // Check if content overflows
  const contentHeight = textObj.height;
  const needsScroll = contentHeight > height - 10;

  if (needsScroll) {
    let scrollY = 0;
    const maxScroll = Math.max(0, contentHeight - height + 20);

    // Scroll indicator
    const scrollIndicator = scene.add.graphics();
    const updateScrollIndicator = () => {
      scrollIndicator.clear();
      const scrollRatio = scrollY / maxScroll;
      const indicatorHeight = Math.max(20, (height / contentHeight) * height);
      const indicatorY = scrollRatio * (height - indicatorHeight);
      scrollIndicator.fillStyle(0x666666, 0.5);
      scrollIndicator.fillRoundedRect(width - 6, indicatorY, 4, indicatorHeight, 2);
    };
    updateScrollIndicator();
    container.add(scrollIndicator);

    // Make container interactive for scrolling
    const hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Drag scrolling
    let isDragging = false;
    let lastY = 0;

    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastY = pointer.y;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const deltaY = lastY - pointer.y;
      scrollY = Phaser.Math.Clamp(scrollY + deltaY, 0, maxScroll);
      contentContainer.y = 5 - scrollY;
      lastY = pointer.y;
      updateScrollIndicator();
    });

    scene.input.on('pointerup', () => {
      isDragging = false;
    });

    // Mouse wheel scrolling
    container.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, dy: number) => {
      scrollY = Phaser.Math.Clamp(scrollY + dy * 0.5, 0, maxScroll);
      contentContainer.y = 5 - scrollY;
      updateScrollIndicator();
    });
  }

  // Store mask for cleanup
  (container as Phaser.GameObjects.Container & { _maskShape: Phaser.GameObjects.Graphics })._maskShape = maskShape;

  return container;
}
