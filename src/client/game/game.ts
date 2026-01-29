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
import { Notebook } from './scenes/Notebook';
import { Profile } from './scenes/Profile';

// Detect if we're on mobile
const isMobile = window.innerWidth < 768;

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
    mode: isMobile ? Phaser.Scale.FIT : Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: isMobile ? 360 : '100%',
    height: isMobile ? 640 : '100%',
  },
  scene: [Boot, Preloader, Loading, MainMenu, CrimeScene, Interrogation, Accusation, Evidence, Notebook, GameOver, Profile],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container');
});
