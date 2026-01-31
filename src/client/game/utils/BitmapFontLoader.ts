import * as Phaser from 'phaser';

/**
 * Generate bitmap fonts dynamically using canvas and Phaser's RetroFont
 */

const CHARS = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

interface FontConfig {
  name: string;
  size: number;
  color: string;
}

const FONT_CONFIGS: FontConfig[] = [
  // Small fonts
  { name: 'noir-sm-white', size: 12, color: '#FFFFFF' },
  { name: 'noir-sm-red', size: 12, color: '#FF4444' },
  { name: 'noir-sm-gold', size: 12, color: '#FFD700' },
  { name: 'noir-sm-green', size: 12, color: '#00FF00' },
  { name: 'noir-sm-cyan', size: 12, color: '#00FFFF' },
  { name: 'noir-sm-gray', size: 12, color: '#888888' },
  // Medium fonts
  { name: 'noir-md-white', size: 16, color: '#FFFFFF' },
  { name: 'noir-md-red', size: 16, color: '#FF4444' },
  { name: 'noir-md-gold', size: 16, color: '#FFD700' },
  { name: 'noir-md-green', size: 16, color: '#00FF00' },
  { name: 'noir-md-cyan', size: 16, color: '#00FFFF' },
  { name: 'noir-md-gray', size: 16, color: '#888888' },
  // Large fonts
  { name: 'noir-lg-white', size: 22, color: '#FFFFFF' },
  { name: 'noir-lg-red', size: 22, color: '#FF4444' },
  { name: 'noir-lg-gold', size: 22, color: '#FFD700' },
  { name: 'noir-lg-green', size: 22, color: '#00FF00' },
  // XLarge fonts
  { name: 'noir-xl-white', size: 28, color: '#FFFFFF' },
  { name: 'noir-xl-red', size: 28, color: '#FF4444' },
];

/**
 * Load all bitmap fonts - call this in create() after preload
 */
export function loadBitmapFonts(scene: Phaser.Scene): void {
  for (const config of FONT_CONFIGS) {
    if (!scene.cache.bitmapFont.exists(config.name)) {
      createBitmapFont(scene, config);
    }
  }
}

/**
 * Get the device pixel ratio for HiDPI rendering
 */
function getPixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance
}

/**
 * Create a single bitmap font using RetroFont with HiDPI support
 */
function createBitmapFont(scene: Phaser.Scene, config: FontConfig): void {
  const { name, size, color } = config;
  const dpr = getPixelRatio();

  // Base dimensions (logical pixels)
  const charWidth = Math.ceil(size * 0.7);
  const charHeight = Math.ceil(size * 1.3);
  const cols = 16;
  const rows = Math.ceil(CHARS.length / cols);

  // Create canvas at HiDPI resolution
  const canvas = document.createElement('canvas');
  canvas.width = cols * charWidth * dpr;
  canvas.height = rows * charHeight * dpr;

  // Set CSS size to logical pixels (for proper scaling)
  canvas.style.width = `${cols * charWidth}px`;
  canvas.style.height = `${rows * charHeight}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Scale context for HiDPI
  ctx.scale(dpr, dpr);

  // Clear with transparency
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Configure font with crisp rendering
  ctx.imageSmoothingEnabled = false;
  ctx.font = `${size}px "Roboto Mono", "JetBrains Mono", "Fira Code", "Inconsolata", monospace`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Draw each character in a grid
  for (let i = 0; i < CHARS.length; i++) {
    const char = CHARS[i];
    if (!char) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * charWidth;
    const y = row * charHeight;

    // Center the character in its cell
    const metrics = ctx.measureText(char);
    const offsetX = (charWidth - metrics.width) / 2;
    ctx.fillText(char, x + offsetX, y + 2);
  }

  // Add texture to Phaser
  const textureKey = `${name}-tex`;
  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }
  scene.textures.addCanvas(textureKey, canvas);

  // Use RetroFont.Parse for proper bitmap font creation
  // Use the HiDPI dimensions for the texture, Phaser will handle scaling
  const retroFontConfig: Phaser.Types.GameObjects.BitmapText.RetroFontConfig = {
    image: textureKey,
    width: charWidth * dpr,
    height: charHeight * dpr,
    chars: CHARS,
    charsPerRow: cols,
    'offset.x': 0,
    'offset.y': 0,
    'spacing.x': 0,
    'spacing.y': 0,
    lineSpacing: 0,
  };

  const fontData = Phaser.GameObjects.RetroFont.Parse(scene, retroFontConfig);
  scene.cache.bitmapFont.add(name, fontData);
}

/**
 * Get the appropriate font name
 */
export function getBitmapFontName(
  size: 'small' | 'medium' | 'large' | 'xlarge',
  color: 'white' | 'red' | 'gold' | 'green' | 'cyan' | 'gray'
): string {
  const sizeMap = { small: 'sm', medium: 'md', large: 'lg', xlarge: 'xl' };
  return `noir-${sizeMap[size]}-${color}`;
}

/**
 * Check if a bitmap font exists, fallback to default
 */
export function getSafeBitmapFontName(
  scene: Phaser.Scene,
  size: 'small' | 'medium' | 'large' | 'xlarge',
  color: 'white' | 'red' | 'gold' | 'green' | 'cyan' | 'gray'
): string {
  const name = getBitmapFontName(size, color);
  if (scene.cache.bitmapFont.exists(name)) {
    return name;
  }
  // Fallback to white version
  const fallback = getBitmapFontName(size, 'white');
  if (scene.cache.bitmapFont.exists(fallback)) {
    return fallback;
  }
  // Ultimate fallback
  return 'noir-md-white';
}
