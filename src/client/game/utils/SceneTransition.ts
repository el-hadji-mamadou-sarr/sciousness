import { Scene } from 'phaser';

/**
 * Helper function to transition to another scene with a loading screen
 */
export function transitionToScene(
  currentScene: Scene,
  targetScene: string,
  targetData?: unknown,
  message?: string
): void {
  currentScene.scene.start('Loading', {
    targetScene,
    targetData,
    message: message || getLoadingMessage(targetScene),
  });
}

/**
 * Get a contextual loading message based on the target scene
 */
function getLoadingMessage(targetScene: string): string {
  switch (targetScene) {
    case 'MainMenu':
      return 'Returning to menu';
    case 'CrimeScene':
      return 'Entering crime scene';
    case 'Interrogation':
      return 'Preparing interrogation';
    case 'Accusation':
      return 'Reviewing evidence';
    case 'Notebook':
      return 'Opening notebook';
    case 'GameOver':
      return 'Processing verdict';
    default:
      return 'Loading';
  }
}
