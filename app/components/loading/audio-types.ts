/**
 * Audio Controller Types and Interfaces
 */

export interface AudioControllerConfig {
  preference: 'enabled' | 'disabled' | 'ask';
  volume: number; // 0-1
  fadeInDuration: number; // ms
  fadeOutDuration: number; // ms
}

export interface AudioState {
  enabled: boolean;
  preference: 'enabled' | 'disabled' | 'ask';
  volume: number; // 0-1
  muted: boolean;
  loading: boolean;
  error?: string;
}

export interface AudioAssets {
  ambient?: HTMLAudioElement;
  particles?: HTMLAudioElement;
  transition?: HTMLAudioElement;
}

export interface AudioControllerInterface {
  // Lifecycle
  initialize(config: AudioControllerConfig): Promise<void>;
  dispose(): void;
  
  // Playback Control
  playAmbient(): Promise<void>;
  playParticleEffect(): Promise<void>;
  playTransition(): Promise<void>;
  stopAll(): void;
  
  // Volume Control
  setVolume(volume: number): void;
  fadeIn(duration: number): Promise<void>;
  fadeOut(duration: number): Promise<void>;
  
  // State Management
  getState(): AudioState;
  setPreference(preference: 'enabled' | 'disabled'): void;
}