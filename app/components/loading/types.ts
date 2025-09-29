/**
 * Loading Screen Types and Interfaces
 * 
 * This file defines all TypeScript interfaces and types for the loading screen system.
 * Based on data-model.md and contract specifications.
 */

export enum LoadingPhase {
  INITIALIZING = 'INITIALIZING',
  LOADING_ASSETS = 'LOADING_ASSETS', 
  ANIMATING = 'ANIMATING',
  TRANSITIONING = 'TRANSITIONING',
  COMPLETE = 'COMPLETE',
}

export interface LoadingScreenProps {
  onComplete: (particleSystem: ParticleSystemState) => void;
  onError: (error: LoadingScreenError) => void;
  skipAnimation?: boolean;
  audioPreference?: 'enabled' | 'disabled' | 'ask' | 'silent';
}

export interface LoadingScreenState {
  currentPhase: LoadingPhase;
  assetsLoaded: AssetLoadingState;
  animationProgress: number; // 0-1
  userInteracted: boolean;
  webglSupported: boolean;
}

export interface LoadingScreenError {
  type: 'webgl-failure' | 'asset-load-failed' | 'animation-error';
  message: string;
  recoverable: boolean;
}

export interface AssetLoadingState {
  textures: boolean;
  shaders: boolean;
  audio: boolean;
  fonts: boolean;
  totalProgress: number; // 0-1
}

export interface ParticleSystemState {
  particleCount: number; // Must be 32768
  positions: Float32Array; // x,y,z per particle
  colors: Float32Array; // r,g,b per particle
  velocities: Float32Array; // vx,vy,vz per particle
  phase: LoadingPhase;
  cameraState?: CameraState;
  webglResources?: WebGLResources;
}

export interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  zoom: number;
}

export interface WebGLResources {
  bufferGeometry: any; // THREE.BufferGeometry
  material: any; // THREE.Material
  renderingMethod: 'instanced' | 'standard';
  memoryUsage: number;
}

export interface AnimationError {
  type: 'invalid-config' | 'animation-error' | 'timeline-error';
  message: string;
  phase?: LoadingPhase;
}

// Performance monitoring interfaces
export interface PerformanceMetrics {
  averageFPS: number;
  targetFPS: number;
  adaptiveQuality: boolean;
  qualityReduction: number; // 0-1, where 1 is maximum reduction
  memoryUsage: number;
  renderTime: number;
}

// Audio system interfaces
export interface AudioState {
  enabled: boolean;
  preference: 'enabled' | 'disabled' | 'ask';
  volume: number; // 0-1
  muted: boolean;
}

// Touch/interaction detection
export interface InteractionState {
  hasTouch: boolean;
  mouseSupported: boolean;
  keyboardSupported: boolean;
  preferredInput: 'touch' | 'mouse' | 'keyboard';
}