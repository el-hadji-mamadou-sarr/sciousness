import * as Phaser from 'phaser';

/**
 * Generates bitmap fonts at runtime using canvas rendering.
 * This provides crisp, pixel-perfect text on all devices including mobile.
 */

// Font configuration
const FONT_CONFIG = {
  chars: ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
  sizes: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
  colors: {
    white: '#FFFFFF',
    red: '#FF4444',
    gold: '#FFD700',
    green: '#00FF00',
    cyan: '#00FFFF',
    gray: '#888888',
    darkGray: '#666666',
    lightGray: '#CCCCCC',
  },
};

/**
 * Generate all bitmap fonts needed for the game
 */
export function generateBitmapFonts(scene: Phaser.Scene): void {
  const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
  const colors = Object.keys(FONT_CONFIG.colors) as (keyof typeof FONT_CONFIG.colors)[];

  for (const size of sizes) {
    for (const color of colors) {
      const fontName = `noir-${size}-${color}`;
      if (!scene.cache.bitmapFont.exists(fontName)) {
        createBitmapFont(scene, fontName, FONT_CONFIG.sizes[size], FONT_CONFIG.colors[color]);
      }
    }
  }
}

/**
 * Create a single bitmap font
 */
function createBitmapFont(
  scene: Phaser.Scene,
  fontName: string,
  fontSize: number,
  color: string
): void {
  const chars = FONT_CONFIG.chars;
  const padding = 2;
  const charWidth = Math.ceil(fontSize * 0.6) + padding;
  const charHeight = fontSize + padding;

  // Create canvas for font texture
  const canvas = document.createElement('canvas');
  const cols = 16;
  const rows = Math.ceil(chars.length / cols);
  canvas.width = cols * charWidth;
  canvas.height = rows * charHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Configure text rendering
  ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Enable crisp rendering
  ctx.imageSmoothingEnabled = false;

  // Draw each character
  const charData: Phaser.Types.GameObjects.BitmapText.BitmapFontCharacterData[] = [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * charWidth;
    const y = row * charHeight;

    // Draw character
    ctx.fillText(char, x + padding / 2, y + padding / 2);

    // Measure character width
    const metrics = ctx.measureText(char);
    const actualWidth = Math.ceil(metrics.width);

    charData.push({
      x: x,
      y: y,
      width: charWidth,
      height: charHeight,
      centerX: charWidth / 2,
      centerY: charHeight / 2,
      xOffset: 0,
      yOffset: 0,
      xAdvance: actualWidth + 1,
      data: {},
      kerning: {},
    });
  }

  // Create texture from canvas
  const textureKey = `${fontName}-texture`;
  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }
  scene.textures.addCanvas(textureKey, canvas);

  // Build font data
  const fontData: Phaser.Types.GameObjects.BitmapText.BitmapFontData = {
    font: fontName,
    size: fontSize,
    lineHeight: charHeight,
    chars: {},
  };

  // Map character codes to font data
  for (let i = 0; i < chars.length; i++) {
    const charCode = chars.charCodeAt(i);
    fontData.chars[charCode] = charData[i];
  }

  // Add bitmap font to cache
  scene.cache.bitmapFont.add(fontName, {
    data: fontData,
    texture: textureKey,
    frame: null,
  });
}

/**
 * Helper to get the appropriate font name based on size and color
 */
export function getFontName(
  size: 'small' | 'medium' | 'large' | 'xlarge',
  color: 'white' | 'red' | 'gold' | 'green' | 'cyan' | 'gray' | 'darkGray' | 'lightGray'
): string {
  return `noir-${size}-${color}`;
}

/**
 * Get font size value for scaling calculations
 */
export function getFontSizeValue(size: 'small' | 'medium' | 'large' | 'xlarge'): number {
  return FONT_CONFIG.sizes[size];
}

/**
 * Determine the best font size based on screen width
 */
export function getResponsiveFontSize(
  screenWidth: number,
  baseSize: 'small' | 'medium' | 'large' | 'xlarge'
): 'small' | 'medium' | 'large' | 'xlarge' {
  // For mobile screens, reduce font size
  if (screenWidth < 400) {
    if (baseSize === 'xlarge') return 'large';
    if (baseSize === 'large') return 'medium';
    return 'small';
  }
  if (screenWidth < 600) {
    if (baseSize === 'xlarge') return 'large';
    return baseSize;
  }
  return baseSize;
}
