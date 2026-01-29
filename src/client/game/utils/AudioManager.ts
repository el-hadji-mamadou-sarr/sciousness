import { Scene } from 'phaser';

const MUSIC_VOLUME_KEY = 'noir_detective_music_volume';
const MUSIC_MUTED_KEY = 'noir_detective_music_muted';

class AudioManagerClass {
  private music: Phaser.Sound.BaseSound | null = null;
  private currentScene: Scene | null = null;
  private volume: number = 0.3;
  private isMuted: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const savedVolume = localStorage.getItem(MUSIC_VOLUME_KEY);
      const savedMuted = localStorage.getItem(MUSIC_MUTED_KEY);
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume);
      }
      if (savedMuted !== null) {
        this.isMuted = savedMuted === 'true';
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, this.volume.toString());
      localStorage.setItem(MUSIC_MUTED_KEY, this.isMuted.toString());
    } catch {
      // Ignore storage errors
    }
  }

  public playMusic(scene: Scene, key: string = 'bgmusic'): void {
    // If music is already playing, don't restart it
    if (this.music && this.music.isPlaying) {
      return;
    }

    this.currentScene = scene;

    // Check if the audio key exists
    if (!scene.cache.audio.exists(key)) {
      console.warn(`Audio key "${key}" not found in cache`);
      return;
    }

    // Create and play the music
    this.music = scene.sound.add(key, {
      volume: this.isMuted ? 0 : this.volume,
      loop: true,
    });

    this.music.play();
  }

  public stopMusic(): void {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }
  }

  public pauseMusic(): void {
    if (this.music && this.music.isPlaying) {
      this.music.pause();
    }
  }

  public resumeMusic(): void {
    if (this.music && this.music.isPaused) {
      this.music.resume();
    }
  }

  public setVolume(volume: number): void {
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.music && !this.isMuted) {
      (this.music as Phaser.Sound.WebAudioSound).setVolume(this.volume);
    }
    this.saveSettings();
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.music) {
      (this.music as Phaser.Sound.WebAudioSound).setVolume(this.isMuted ? 0 : this.volume);
    }
    this.saveSettings();
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.music) {
      (this.music as Phaser.Sound.WebAudioSound).setVolume(this.isMuted ? 0 : this.volume);
    }
    this.saveSettings();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isPlaying(): boolean {
    return this.music !== null && this.music.isPlaying;
  }
}

// Singleton instance
export const AudioManager = new AudioManagerClass();
