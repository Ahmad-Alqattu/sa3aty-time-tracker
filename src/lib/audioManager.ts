// Audio Manager - handles all audio operations for ambient sounds
export type SoundType = 'rain' | 'fireplace' | 'waves' | 'cafe';

interface SoundConfig {
  id: SoundType;
  localPath: string;
}

const SOUNDS: SoundConfig[] = [
  { id: 'rain', localPath: '/rain.mp3' },
  { id: 'fireplace', localPath: '/fiar.mp3' },
  { id: 'waves', localPath: '/waves.mp3' },
  { id: 'cafe', localPath: '/cafe.mp3' }
];

// Track if user manually paused sounds (prevents timer sync from resuming)
let isManuallyPaused = false;

class AudioManager {
  private audioElements: Map<SoundType, HTMLAudioElement> = new Map();
  private initialized = false;
  
  init(basePath: string) {
    if (this.initialized) return;
    
    SOUNDS.forEach(sound => {
      const audio = new Audio(`${basePath}${sound.localPath}`);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.5;
      this.audioElements.set(sound.id, audio);
    });
    
    this.initialized = true;
  }
  
  play(soundId: SoundType) {
    const audio = this.audioElements.get(soundId);
    if (audio) {
      audio.currentTime = audio.currentTime || 0;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(err => console.error(`Failed to play ${soundId}:`, err));
      }
    }
  }
  
  pause(soundId: SoundType) {
    const audio = this.audioElements.get(soundId);
    if (audio) {
      audio.pause();
    }
  }
  
  setVolume(soundId: SoundType, volume: number) {
    const audio = this.audioElements.get(soundId);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
  
  isPlaying(soundId: SoundType): boolean {
    const audio = this.audioElements.get(soundId);
    return audio ? !audio.paused : false;
  }
  
  cleanup() {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements.clear();
    this.initialized = false;
  }
  
  pauseAll() {
    this.audioElements.forEach(audio => {
      audio.pause();
    });
  }
  
  resumeAll(enabledSounds: Set<SoundType>) {
    enabledSounds.forEach(soundId => {
      const audio = this.audioElements.get(soundId);
      if (audio) {
        audio.play().catch(err => console.error(`Failed to resume ${soundId}:`, err));
      }
    });
  }
}

// Singleton audio manager
export const audioManager = new AudioManager();

// Set manual pause state (called when user clicks mute button)
export function setManuallyPaused(paused: boolean) {
  isManuallyPaused = paused;
  localStorage.setItem('ambientManuallyPaused', paused.toString());
}

export function getManuallyPaused(): boolean {
  // Check both memory and localStorage (for page refresh scenarios)
  const stored = localStorage.getItem('ambientManuallyPaused');
  if (stored !== null) {
    isManuallyPaused = stored === 'true';
  }
  return isManuallyPaused;
}

// Export functions for external control (timer sync)
export function pauseAllSounds() {
  audioManager.pauseAll();
}

export function resumeAllSounds() {
  // Don't resume if user manually paused
  if (getManuallyPaused()) {
    return;
  }
  
  const savedEnabledSounds = localStorage.getItem('ambientEnabledSounds');
  if (savedEnabledSounds) {
    try {
      const sounds = JSON.parse(savedEnabledSounds) as SoundType[];
      audioManager.resumeAll(new Set(sounds));
    } catch (e) {
      console.error('Failed to resume sounds', e);
    }
  }
}

export function getSoundTimerSyncEnabled(): boolean {
  return localStorage.getItem('ambientSoundTimerSync') === 'true';
}
