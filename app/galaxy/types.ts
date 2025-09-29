/**
 * Galaxy Particle System Types
 * 
 * Extended types for the galaxy particle system integration.
 */

import * as THREE from 'three';
import { LoadingPhase } from '../components/loading/types';

export interface ParticleSystemState {
  particleCount: number; // Must be 32768
  positions: Float32Array; // x,y,z per particle  
  colors: Float32Array; // r,g,b per particle
  velocities: Float32Array; // vx,vy,vz per particle
  phase: LoadingPhase;
  cameraState?: CameraState;
  webglResources?: WebGLResources;
}

export interface ParticleSystemConfig {
  particleCount: number; // Must match main galaxy system
  colors: ParticleColors;
  explosionCenter: THREE.Vector3;
  webglContext: WebGLRenderingContext;
  performanceLevel: 'high' | 'medium' | 'low';
}

export interface ParticleColors {
  cyan: THREE.Color;    // #0891b2
  blue: THREE.Color;    // #3b82f6  
  magenta: THREE.Color; // #ec4899
}

export interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  zoom: number;
}

export interface WebGLResources {
  bufferGeometry: THREE.BufferGeometry;
  material: THREE.Material;
  renderingMethod: 'instanced' | 'standard';
  memoryUsage: number;
}

export interface PerformanceMetrics {
  averageFPS: number;
  targetFPS: number;
  adaptiveQuality: boolean;
  qualityReduction: number; // 0-1, where 1 is maximum reduction
  memoryUsage: number;
  renderTime: number;
}

export interface GalaxyHandoffData {
  particleState: ParticleSystemState;
  webglResources: WebGLResources;
  cameraState: CameraState;
}

// Performance constants
export const PERFORMANCE_TARGETS = {
  TARGET_FPS: 60,
  MIN_FPS: 55,
  PARTICLE_COUNT: 32768,
  MAX_MEMORY_MB: 100,
  MAX_RENDER_TIME_MS: 16.67, // 60fps = ~16.67ms per frame
} as const;