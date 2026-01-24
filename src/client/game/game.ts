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
    width: 360,
    height: 640,
  },
  scene: [Boot, Preloader, Loading, MainMenu, CrimeScene, Interrogation, Accusation, GameOver],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container');
});
