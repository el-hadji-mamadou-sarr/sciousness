import { GameObjects } from 'phaser';

/**
 * Procedural Graphics Utility
 * Generates sprite-like visuals using Phaser's Graphics API
 */

// Simple seeded random number generator for consistent results
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Hash string to number for seeding
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Color palettes
const SKIN_TONES = [0xf5d0c5, 0xe8beac, 0xd4a574, 0xc68642, 0x8d5524, 0x6b3e26];
const HAIR_COLORS = [0x2c1810, 0x4a3728, 0x8b4513, 0xd4a574, 0x808080, 0x1a1a1a, 0xc41e3a];
const EYE_COLORS = [0x4a90a4, 0x634e34, 0x2e8b57, 0x808080, 0x1a1a1a];

interface PortraitFeatures {
  headShape: 'round' | 'oval' | 'square';
  skinTone: number;
  hairStyle: 'short' | 'medium' | 'long' | 'bald' | 'spiky';
  hairColor: number;
  eyeStyle: 'normal' | 'narrow' | 'wide' | 'tired';
  eyeColor: number;
  noseSize: 'small' | 'medium' | 'large';
  mouthStyle: 'neutral' | 'smile' | 'frown' | 'thin';
  hasBeard: boolean;
  hasGlasses: boolean;
  hasScars: boolean;
}

/**
 * Generate portrait features based on suspect ID for consistency
 */
export function generatePortraitFeatures(suspectId: string): PortraitFeatures {
  const random = seededRandom(hashString(suspectId));

  const headShapes: PortraitFeatures['headShape'][] = ['round', 'oval', 'square'];
  const hairStyles: PortraitFeatures['hairStyle'][] = ['short', 'medium', 'long', 'bald', 'spiky'];
  const eyeStyles: PortraitFeatures['eyeStyle'][] = ['normal', 'narrow', 'wide', 'tired'];
  const noseSizes: PortraitFeatures['noseSize'][] = ['small', 'medium', 'large'];
  const mouthStyles: PortraitFeatures['mouthStyle'][] = ['neutral', 'smile', 'frown', 'thin'];

  return {
    headShape: headShapes[Math.floor(random() * headShapes.length)],
    skinTone: SKIN_TONES[Math.floor(random() * SKIN_TONES.length)],
    hairStyle: hairStyles[Math.floor(random() * hairStyles.length)],
    hairColor: HAIR_COLORS[Math.floor(random() * HAIR_COLORS.length)],
    eyeStyle: eyeStyles[Math.floor(random() * eyeStyles.length)],
    eyeColor: EYE_COLORS[Math.floor(random() * EYE_COLORS.length)],
    noseSize: noseSizes[Math.floor(random() * noseSizes.length)],
    mouthStyle: mouthStyles[Math.floor(random() * mouthStyles.length)],
    hasBeard: random() > 0.6,
    hasGlasses: random() > 0.7,
    hasScars: random() > 0.85,
  };
}

/**
 * Draw a detailed suspect portrait
 */
export function drawSuspectPortrait(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  suspectId: string,
  isGuilty: boolean = false
): void {
  const features = generatePortraitFeatures(suspectId);
  const scale = size / 65; // Base size is 65

  // Background
  graphics.fillStyle(0x2a2a3e, 1);
  graphics.fillRect(x - size / 2, y - size / 2, size, size);
  graphics.lineStyle(2, isGuilty ? 0xff4444 : 0x5c6b8a, 1);
  graphics.strokeRect(x - size / 2, y - size / 2, size, size);

  const centerX = x;
  const centerY = y + size * 0.05;

  // Draw head shape
  graphics.fillStyle(features.skinTone, 1);

  switch (features.headShape) {
    case 'round':
      graphics.fillCircle(centerX, centerY, size * 0.35);
      break;
    case 'oval':
      graphics.fillEllipse(centerX, centerY, size * 0.32, size * 0.38);
      break;
    case 'square':
      graphics.fillRoundedRect(
        centerX - size * 0.28,
        centerY - size * 0.32,
        size * 0.56,
        size * 0.64,
        size * 0.08
      );
      break;
  }

  // Draw hair
  drawHair(graphics, centerX, centerY, size, features);

  // Draw eyes
  drawEyes(graphics, centerX, centerY, size, features);

  // Draw nose
  drawNose(graphics, centerX, centerY, size, features);

  // Draw mouth
  drawMouth(graphics, centerX, centerY, size, features);

  // Draw beard if applicable
  if (features.hasBeard) {
    drawBeard(graphics, centerX, centerY, size, features);
  }

  // Draw glasses if applicable
  if (features.hasGlasses) {
    drawGlasses(graphics, centerX, centerY, size);
  }

  // Draw scar if applicable
  if (features.hasScars) {
    drawScar(graphics, centerX, centerY, size);
  }

  // Guilty indicator - subtle red tint
  if (isGuilty) {
    graphics.fillStyle(0xff0000, 0.1);
    graphics.fillRect(x - size / 2, y - size / 2, size, size);
  }
}

function drawHair(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  features: PortraitFeatures
): void {
  if (features.hairStyle === 'bald') return;

  graphics.fillStyle(features.hairColor, 1);
  const headTop = y - size * 0.35;
  const headWidth = size * 0.35;

  switch (features.hairStyle) {
    case 'short':
      // Short cropped hair
      graphics.fillEllipse(x, headTop + size * 0.08, headWidth * 0.95, size * 0.15);
      break;
    case 'medium':
      // Medium length hair with sides
      graphics.fillEllipse(x, headTop + size * 0.05, headWidth * 1.1, size * 0.18);
      graphics.fillRect(x - headWidth * 0.9, headTop + size * 0.1, size * 0.12, size * 0.15);
      graphics.fillRect(x + headWidth * 0.9 - size * 0.12, headTop + size * 0.1, size * 0.12, size * 0.15);
      break;
    case 'long':
      // Long flowing hair
      graphics.fillEllipse(x, headTop + size * 0.03, headWidth * 1.15, size * 0.2);
      graphics.fillRect(x - headWidth * 1.0, headTop + size * 0.08, size * 0.15, size * 0.35);
      graphics.fillRect(x + headWidth * 1.0 - size * 0.15, headTop + size * 0.08, size * 0.15, size * 0.35);
      break;
    case 'spiky':
      // Spiky punk hair
      for (let i = -3; i <= 3; i++) {
        const spikeX = x + i * size * 0.08;
        const spikeHeight = size * (0.12 + Math.abs(i) * 0.02);
        graphics.fillTriangle(
          spikeX - size * 0.04, headTop + size * 0.12,
          spikeX + size * 0.04, headTop + size * 0.12,
          spikeX, headTop - spikeHeight
        );
      }
      break;
  }
}

function drawEyes(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  features: PortraitFeatures
): void {
  const eyeY = y - size * 0.08;
  const eyeSpacing = size * 0.15;

  // Eye whites
  graphics.fillStyle(0xffffff, 1);

  let eyeWidth = size * 0.1;
  let eyeHeight = size * 0.06;

  switch (features.eyeStyle) {
    case 'narrow':
      eyeHeight = size * 0.04;
      break;
    case 'wide':
      eyeHeight = size * 0.08;
      eyeWidth = size * 0.12;
      break;
    case 'tired':
      eyeHeight = size * 0.05;
      break;
  }

  // Left eye
  graphics.fillEllipse(x - eyeSpacing, eyeY, eyeWidth, eyeHeight);
  // Right eye
  graphics.fillEllipse(x + eyeSpacing, eyeY, eyeWidth, eyeHeight);

  // Pupils
  graphics.fillStyle(features.eyeColor, 1);
  const pupilSize = eyeHeight * 0.7;
  graphics.fillCircle(x - eyeSpacing, eyeY, pupilSize);
  graphics.fillCircle(x + eyeSpacing, eyeY, pupilSize);

  // Pupil highlight
  graphics.fillStyle(0xffffff, 0.8);
  graphics.fillCircle(x - eyeSpacing - pupilSize * 0.3, eyeY - pupilSize * 0.3, pupilSize * 0.3);
  graphics.fillCircle(x + eyeSpacing - pupilSize * 0.3, eyeY - pupilSize * 0.3, pupilSize * 0.3);

  // Eyebrows
  graphics.fillStyle(features.hairColor, 1);
  const browY = eyeY - eyeHeight - size * 0.02;

  if (features.eyeStyle === 'tired') {
    // Droopy eyebrows
    graphics.fillRect(x - eyeSpacing - eyeWidth * 0.8, browY, eyeWidth * 1.6, size * 0.02);
    graphics.fillRect(x + eyeSpacing - eyeWidth * 0.8, browY, eyeWidth * 1.6, size * 0.02);
  } else {
    // Normal/arched eyebrows
    graphics.fillEllipse(x - eyeSpacing, browY, eyeWidth * 0.9, size * 0.02);
    graphics.fillEllipse(x + eyeSpacing, browY, eyeWidth * 0.9, size * 0.02);
  }
}

function drawNose(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  features: PortraitFeatures
): void {
  const noseY = y + size * 0.02;
  graphics.fillStyle(darkenColor(features.skinTone, 0.15), 1);

  let noseWidth = size * 0.06;
  let noseHeight = size * 0.1;

  switch (features.noseSize) {
    case 'small':
      noseWidth = size * 0.04;
      noseHeight = size * 0.07;
      break;
    case 'large':
      noseWidth = size * 0.09;
      noseHeight = size * 0.13;
      break;
  }

  // Simple nose shape
  graphics.fillTriangle(
    x, noseY - noseHeight * 0.5,
    x - noseWidth, noseY + noseHeight * 0.5,
    x + noseWidth, noseY + noseHeight * 0.5
  );
}

function drawMouth(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  features: PortraitFeatures
): void {
  const mouthY = y + size * 0.18;
  const mouthWidth = size * 0.15;

  switch (features.mouthStyle) {
    case 'neutral':
      graphics.lineStyle(2, darkenColor(features.skinTone, 0.3), 1);
      graphics.lineBetween(x - mouthWidth * 0.5, mouthY, x + mouthWidth * 0.5, mouthY);
      break;
    case 'smile':
      graphics.lineStyle(2, darkenColor(features.skinTone, 0.3), 1);
      // Draw curved smile
      graphics.beginPath();
      graphics.moveTo(x - mouthWidth * 0.5, mouthY - size * 0.01);
      graphics.lineTo(x, mouthY + size * 0.03);
      graphics.lineTo(x + mouthWidth * 0.5, mouthY - size * 0.01);
      graphics.strokePath();
      break;
    case 'frown':
      graphics.lineStyle(2, darkenColor(features.skinTone, 0.3), 1);
      // Draw curved frown
      graphics.beginPath();
      graphics.moveTo(x - mouthWidth * 0.5, mouthY + size * 0.02);
      graphics.lineTo(x, mouthY - size * 0.02);
      graphics.lineTo(x + mouthWidth * 0.5, mouthY + size * 0.02);
      graphics.strokePath();
      break;
    case 'thin':
      graphics.lineStyle(1, darkenColor(features.skinTone, 0.35), 1);
      graphics.lineBetween(x - mouthWidth * 0.4, mouthY, x + mouthWidth * 0.4, mouthY);
      break;
  }
}

function drawBeard(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  features: PortraitFeatures
): void {
  graphics.fillStyle(features.hairColor, 0.8);

  // Beard area
  const beardTop = y + size * 0.1;
  const beardBottom = y + size * 0.35;

  // Chin area
  graphics.fillEllipse(x, beardBottom - size * 0.05, size * 0.2, size * 0.12);

  // Sides
  graphics.fillRect(x - size * 0.25, beardTop, size * 0.08, size * 0.15);
  graphics.fillRect(x + size * 0.17, beardTop, size * 0.08, size * 0.15);

  // Mustache
  graphics.fillEllipse(x - size * 0.06, y + size * 0.14, size * 0.06, size * 0.025);
  graphics.fillEllipse(x + size * 0.06, y + size * 0.14, size * 0.06, size * 0.025);
}

function drawGlasses(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number
): void {
  const glassY = y - size * 0.08;
  const eyeSpacing = size * 0.15;
  const lensSize = size * 0.12;

  graphics.lineStyle(2, 0x333333, 1);

  // Left lens
  graphics.strokeCircle(x - eyeSpacing, glassY, lensSize);
  // Right lens
  graphics.strokeCircle(x + eyeSpacing, glassY, lensSize);
  // Bridge
  graphics.lineBetween(x - eyeSpacing + lensSize, glassY, x + eyeSpacing - lensSize, glassY);
  // Arms
  graphics.lineBetween(x - eyeSpacing - lensSize, glassY, x - size * 0.35, glassY - size * 0.02);
  graphics.lineBetween(x + eyeSpacing + lensSize, glassY, x + size * 0.35, glassY - size * 0.02);
}

function drawScar(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  size: number
): void {
  graphics.lineStyle(2, 0xcc9999, 0.7);
  // Diagonal scar on cheek
  const scarX = x + size * 0.15;
  const scarY = y + size * 0.05;
  graphics.lineBetween(scarX - size * 0.08, scarY - size * 0.05, scarX + size * 0.04, scarY + size * 0.08);
}

// Helper to darken a color
function darkenColor(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (color & 0xff) * (1 - amount));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

/**
 * Draw a detailed crime scene object
 */
export function drawCrimeSceneObject(
  graphics: GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  objectType: string
): void {
  switch (objectType.toLowerCase()) {
    case 'desk':
      drawDesk(graphics, x, y, width, height);
      break;
    case 'computer':
    case 'keyboard':
      drawComputer(graphics, x, y, width, height);
      break;
    case 'coffee':
    case 'mug':
      drawCoffeeMug(graphics, x, y, width, height);
      break;
    case 'plant':
      drawPlant(graphics, x, y, width, height);
      break;
    case 'window':
      drawWindow(graphics, x, y, width, height);
      break;
    case 'phone':
    case 'smartphone':
      drawPhone(graphics, x, y, width, height);
      break;
    case 'body':
    case 'victim':
      drawVictimOutline(graphics, x, y, width, height);
      break;
    default:
      // Default: simple evidence marker
      drawEvidenceMarker(graphics, x, y, width, height);
  }
}

function drawDesk(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Desk surface
  g.fillStyle(0x5c4033, 1);
  g.fillRect(x, y, w, h * 0.3);

  // Desk front
  g.fillStyle(0x4a3728, 1);
  g.fillRect(x, y + h * 0.3, w, h * 0.7);

  // Drawer
  g.fillStyle(0x3d2d1f, 1);
  g.fillRect(x + w * 0.1, y + h * 0.4, w * 0.35, h * 0.25);
  g.fillRect(x + w * 0.55, y + h * 0.4, w * 0.35, h * 0.25);

  // Drawer handles
  g.fillStyle(0xc0c0c0, 1);
  g.fillCircle(x + w * 0.275, y + h * 0.525, w * 0.03);
  g.fillCircle(x + w * 0.725, y + h * 0.525, w * 0.03);

  // Papers on desk
  g.fillStyle(0xf5f5dc, 0.9);
  g.fillRect(x + w * 0.6, y + h * 0.05, w * 0.25, h * 0.15);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(x + w * 0.15, y + h * 0.08, w * 0.2, h * 0.12);
}

function drawComputer(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Monitor
  g.fillStyle(0x1a1a1a, 1);
  g.fillRoundedRect(x, y, w, h * 0.7, 4);

  // Screen
  g.fillStyle(0x0a2040, 1);
  g.fillRect(x + w * 0.08, y + h * 0.08, w * 0.84, h * 0.5);

  // Screen glow
  g.fillStyle(0x00ffff, 0.1);
  g.fillRect(x + w * 0.08, y + h * 0.08, w * 0.84, h * 0.5);

  // Text lines on screen
  g.fillStyle(0x00ff00, 0.6);
  for (let i = 0; i < 4; i++) {
    g.fillRect(x + w * 0.12, y + h * 0.15 + i * h * 0.1, w * (0.5 + Math.random() * 0.2), h * 0.03);
  }

  // Stand
  g.fillStyle(0x333333, 1);
  g.fillRect(x + w * 0.4, y + h * 0.7, w * 0.2, h * 0.15);
  g.fillRect(x + w * 0.25, y + h * 0.85, w * 0.5, h * 0.08);
}

function drawCoffeeMug(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Mug body
  g.fillStyle(0xf5f5f5, 1);
  g.fillRoundedRect(x + w * 0.2, y + h * 0.2, w * 0.6, h * 0.75, 4);

  // Coffee inside
  g.fillStyle(0x3d2314, 1);
  g.fillEllipse(x + w * 0.5, y + h * 0.35, w * 0.25, h * 0.1);

  // Handle
  g.lineStyle(4, 0xf5f5f5, 1);
  g.beginPath();
  g.arc(x + w * 0.85, y + h * 0.55, w * 0.15, -Math.PI * 0.5, Math.PI * 0.5, false);
  g.strokePath();

  // Steam
  g.lineStyle(2, 0xcccccc, 0.5);
  g.beginPath();
  g.moveTo(x + w * 0.4, y + h * 0.1);
  g.lineTo(x + w * 0.35, y);
  g.moveTo(x + w * 0.5, y + h * 0.1);
  g.lineTo(x + w * 0.55, y);
  g.moveTo(x + w * 0.6, y + h * 0.1);
  g.lineTo(x + w * 0.55, y);
  g.strokePath();
}

function drawPlant(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Pot
  g.fillStyle(0x8b4513, 1);
  g.fillRect(x + w * 0.25, y + h * 0.6, w * 0.5, h * 0.35);
  g.fillStyle(0x654321, 1);
  g.fillRect(x + w * 0.2, y + h * 0.55, w * 0.6, h * 0.1);

  // Dirt
  g.fillStyle(0x3d2314, 1);
  g.fillEllipse(x + w * 0.5, y + h * 0.6, w * 0.22, h * 0.05);

  // Stem
  g.fillStyle(0x228b22, 1);
  g.fillRect(x + w * 0.47, y + h * 0.2, w * 0.06, h * 0.4);

  // Leaves
  g.fillStyle(0x32cd32, 1);
  g.fillEllipse(x + w * 0.3, y + h * 0.25, w * 0.15, h * 0.08);
  g.fillEllipse(x + w * 0.7, y + h * 0.3, w * 0.15, h * 0.08);
  g.fillEllipse(x + w * 0.35, y + h * 0.4, w * 0.12, h * 0.06);
  g.fillEllipse(x + w * 0.65, y + h * 0.15, w * 0.12, h * 0.06);

  // Flower/bud
  g.fillStyle(0xff69b4, 0.8);
  g.fillCircle(x + w * 0.5, y + h * 0.12, w * 0.08);
}

function drawWindow(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Frame
  g.fillStyle(0x4a3728, 1);
  g.fillRect(x, y, w, h);

  // Glass panes
  g.fillStyle(0x87ceeb, 0.4);
  g.fillRect(x + w * 0.08, y + h * 0.08, w * 0.38, h * 0.38);
  g.fillRect(x + w * 0.54, y + h * 0.08, w * 0.38, h * 0.38);
  g.fillRect(x + w * 0.08, y + h * 0.54, w * 0.38, h * 0.38);
  g.fillRect(x + w * 0.54, y + h * 0.54, w * 0.38, h * 0.38);

  // Cross frame
  g.fillStyle(0x3d2d1f, 1);
  g.fillRect(x + w * 0.46, y, w * 0.08, h);
  g.fillRect(x, y + h * 0.46, w, h * 0.08);

  // Moon outside
  g.fillStyle(0xfffacd, 0.6);
  g.fillCircle(x + w * 0.75, y + h * 0.25, w * 0.1);
}

function drawPhone(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Phone body
  g.fillStyle(0x1a1a1a, 1);
  g.fillRoundedRect(x + w * 0.2, y, w * 0.6, h, 6);

  // Screen
  g.fillStyle(0x0a0a2a, 1);
  g.fillRoundedRect(x + w * 0.25, y + h * 0.08, w * 0.5, h * 0.75, 2);

  // Screen glow
  g.fillStyle(0x4444ff, 0.2);
  g.fillRoundedRect(x + w * 0.25, y + h * 0.08, w * 0.5, h * 0.75, 2);

  // Home button
  g.fillStyle(0x333333, 1);
  g.fillCircle(x + w * 0.5, y + h * 0.92, w * 0.08);
}

function drawVictimOutline(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Chalk outline style
  g.lineStyle(3, 0xffffff, 0.7);

  // Head
  g.strokeCircle(x + w * 0.5, y + h * 0.15, w * 0.12);

  // Body
  g.lineBetween(x + w * 0.5, y + h * 0.27, x + w * 0.5, y + h * 0.55);

  // Arms
  g.lineBetween(x + w * 0.5, y + h * 0.35, x + w * 0.2, y + h * 0.5);
  g.lineBetween(x + w * 0.5, y + h * 0.35, x + w * 0.8, y + h * 0.45);

  // Legs
  g.lineBetween(x + w * 0.5, y + h * 0.55, x + w * 0.3, y + h * 0.95);
  g.lineBetween(x + w * 0.5, y + h * 0.55, x + w * 0.7, y + h * 0.9);

  // Blood pool effect
  g.fillStyle(0x8b0000, 0.4);
  g.fillEllipse(x + w * 0.6, y + h * 0.7, w * 0.25, h * 0.15);
}

function drawEvidenceMarker(g: GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  // Yellow evidence marker
  g.fillStyle(0xffd700, 1);
  g.fillRect(x + w * 0.3, y + h * 0.2, w * 0.4, h * 0.6);

  // Number on marker
  g.fillStyle(0x000000, 1);
  g.fillCircle(x + w * 0.5, y + h * 0.5, w * 0.12);

  // Stand
  g.fillStyle(0xffd700, 1);
  g.fillRect(x + w * 0.45, y + h * 0.8, w * 0.1, h * 0.2);
}
