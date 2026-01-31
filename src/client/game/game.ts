import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { ModeSelect } from './scenes/ModeSelect';
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
import { WeekOverview } from './scenes/WeekOverview';
import { ChapterScene } from './scenes/ChapterScene';

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
    // Always use RESIZE mode to fill the container dynamically
    // Mobile detection is handled per-scene based on current canvas size
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [Boot, Preloader, Loading, ModeSelect, MainMenu, CrimeScene, Interrogation, Accusation, Evidence, Notebook, GameOver, Profile, WeekOverview, ChapterScene],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container');
});
