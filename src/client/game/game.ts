import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { Loading } from './scenes/Loading';
import { CrimeScene } from './scenes/CrimeScene';
import { Interrogation } from './scenes/Interrogation';
import { Accusation } from './scenes/Accusation';
import { Evidence } from './scenes/Evidence';

// Detect if we're on desktop (wider screen) or mobile
const isDesktop = window.innerWidth >= 768;
const gameWidth = isDesktop ? 1280 : 360;
const gameHeight = isDesktop ? 720 : 640;

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0a14',
  // Fix canvas resolution for crisp rendering on high-DPI displays
  resolution: window.devicePixelRatio,
  // Disable pixel rounding for better thin stroke rendering in fonts
  roundPixels: false,
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameWidth,
    height: gameHeight,
  },
  scene: [Boot, Preloader, Loading, MainMenu, CrimeScene, Interrogation, Accusation, Evidence, GameOver],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container');
});
