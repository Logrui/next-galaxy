/**
 * ParticleSystem - Enhanced Galaxy Particle Management
 * 
 * Extends the existing galaxy particle system to support loading screen integration.
 * Maintains 32,768 particle count consistency and WebGL resource sharing.
 */

import * as THREE from 'three';
import { random } from 'canvas-sketch-util';
import { LoadingPhase, ParticleSystemState } from '../components/loading/types';
import { ParticleSystemConfig, ParticleColors } from './types';

export class ParticleSystem {
  private geometry: THREE.BufferGeometry;
  private material: THREE.RawShaderMaterial;
  private points: THREE.Points;
  private uniforms: { [key: string]: any };
  private particleCount = 32768; // Must match loading system
  
  // State tracking
  private currentPhase: LoadingPhase = LoadingPhase.INITIALIZING;
  private animationMixer: THREE.AnimationMixer | null = null;

  constructor(config: ParticleSystemConfig, uniforms: { [key: string]: any }) {
    this.uniforms = uniforms;
    
    // Create geometry and material
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();
    
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.rotation.x = Math.PI / 2;
  }

  private createGeometry(): THREE.BufferGeometry {
    // Generate particle positions (matching original algorithm)
    const positions = new Float32Array(this.particleCount * 3);
    const e = 300; // spread range
    
    for (let i = 0; i < this.particleCount; i++) {
      const offset = i * 3;
      positions[offset] = random.range(-e, e);
      positions[offset + 1] = random.range(-e, e);
      positions[offset + 2] = random.range(-e, e);
    }

    // Generate UV coordinates (for texture mapping)
    const uvs = new Float32Array(this.particleCount * 2);
    let uvIndex = 0;
    
    for (let r = 0; r < 128; r++) {
      for (let o = 0; o < 256; o++) {
        uvs[uvIndex * 2] = 1 / 256 + o / 257;
        uvs[uvIndex * 2 + 1] = 1 / 128 + r / 129;
        uvIndex++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geometry;
  }

  private createMaterial(): THREE.RawShaderMaterial {
    // Create a placeholder material - will be replaced by parent component
    return new THREE.RawShaderMaterial({
      vertexShader: 'void main() { gl_Position = vec4(0.0); }',
      fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }',
      transparent: true
    });
  }

  /**
   * Initialize from loading screen particle state
   */
  public initializeFromLoadingState(loadingState: ParticleSystemState): void {
    if (loadingState.particleCount !== this.particleCount) {
      console.warn(`Particle count mismatch: expected ${this.particleCount}, got ${loadingState.particleCount}`);
    }

    // Apply loading screen particle positions if available
    if (loadingState.positions.length === this.particleCount * 3) {
      const positionAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      
      // Smooth transition from loading positions to galaxy positions
      this.animateParticleTransition(loadingState.positions, positionAttribute.array as Float32Array);
    }

    // Apply loading screen particle colors
    if (loadingState.colors.length === this.particleCount * 3) {
      this.applyColorTransition(loadingState.colors);
    }

    this.currentPhase = loadingState.phase;
  }

  private animateParticleTransition(fromPositions: Float32Array, toPositions: Float32Array): void {
    // Create smooth transition animation between loading and galaxy positions
    const transitionDuration = 2000; // 2 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      
      // Smooth easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      const positionAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = positionAttribute.array as Float32Array;
      
      // Interpolate positions
      for (let i = 0; i < fromPositions.length; i++) {
        positions[i] = fromPositions[i] + (toPositions[i] - fromPositions[i]) * easedProgress;
      }
      
      positionAttribute.needsUpdate = true;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private applyColorTransition(loadingColors: Float32Array): void {
    // Transition from loading screen colors to galaxy colors
    // This can be handled through uniforms and shaders for performance
    
    // Update uniform values to create color transition effect
    if (this.uniforms.fade) {
      this.uniforms.fade.value = 1; // Start with loading colors
      
      // Animate to galaxy colors over time
      const startTime = Date.now();
      const duration = 1500;
      
      const fadeToGalaxy = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.uniforms.fade.value = 1 - progress; // Fade from loading to galaxy
        
        if (progress < 1) {
          requestAnimationFrame(fadeToGalaxy);
        }
      };
      
      setTimeout(fadeToGalaxy, 500); // Start fade after brief delay
    }
  }

  /**
   * Export current particle state (for potential future loading screen integration)
   */
  public exportParticleState(): ParticleSystemState {
    const positionAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = new Float32Array(positionAttribute.array);
    
    // Generate colors based on current material state
    const colors = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < colors.length; i += 3) {
      // Use current material tint for colors
      const tint = this.uniforms.tint?.value || new THREE.Color(1, 1, 1);
      colors[i] = tint.r;
      colors[i + 1] = tint.g;
      colors[i + 2] = tint.b;
    }
    
    // Generate velocities (static for galaxy view)
    const velocities = new Float32Array(this.particleCount * 3);
    
    return {
      particleCount: this.particleCount,
      positions,
      colors,
      velocities,
      phase: this.currentPhase,
      cameraState: this.getCameraState(),
      webglResources: {
        bufferGeometry: this.geometry,
        material: this.material,
        renderingMethod: 'instanced',
        memoryUsage: (positions.length + colors.length) * 4
      }
    };
  }

  private getCameraState() {
    // This would be implemented with camera reference
    // For now, return null as camera is managed by parent component
    return undefined;
  }

  /**
   * Update particle system animation
   */
  public update(deltaTime: number): void {
    // Update uniforms for animation
    if (this.uniforms.time) {
      this.uniforms.time.value += deltaTime;
    }
    
    // Update any particle-specific animations
    if (this.animationMixer) {
      this.animationMixer.update(deltaTime);
    }
  }

  /**
   * Handle loading screen completion handoff
   */
  public receiveLoadingHandoff(loadingState: ParticleSystemState): void {
    console.log('Receiving particle system handoff from loading screen');
    this.initializeFromLoadingState(loadingState);
    
    // Trigger any completion animations
    this.triggerGalaxyIntroAnimation();
  }

  private triggerGalaxyIntroAnimation(): void {
    // Enhanced intro animation after loading completion
    if (this.uniforms.globalAlpha) {
      this.uniforms.globalAlpha.value = 0;
      
      // Fade in galaxy over 1.5 seconds
      const startTime = Date.now();
      const duration = 1500;
      
      const fadeIn = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth ease-in
        const easedProgress = progress * progress * (3 - 2 * progress); // smoothstep
        this.uniforms.globalAlpha.value = easedProgress;
        
        if (progress < 1) {
          requestAnimationFrame(fadeIn);
        }
      };
      
      fadeIn();
    }
  }

  /**
   * Get the Three.js Points object for scene integration
   */
  public getPoints(): THREE.Points {
    return this.points;
  }

  /**
   * Get the geometry for external access
   */
  public getGeometry(): THREE.BufferGeometry {
    return this.geometry;
  }

  /**
   * Get the material for external access
   */
  public getMaterial(): THREE.RawShaderMaterial {
    return this.material;
  }

  /**
   * Set material (called by parent component)
   */
  public setMaterial(material: THREE.RawShaderMaterial): void {
    this.material = material;
    this.points.material = material;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.geometry.dispose();
    if (this.material) {
      this.material.dispose();
    }
    if (this.animationMixer) {
      this.animationMixer.stopAllAction();
    }
  }
}