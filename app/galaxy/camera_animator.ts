import * as THREE from 'three';
import { gsap } from 'gsap';
import { CameraPreset } from './location_presets';

export interface AnimationOptions {
  duration?: number;
  ease?: string;
  onUpdate?: () => void;
  onComplete?: () => void;
}

export class CameraAnimator {
  private camera: THREE.Camera;
  private controls: any;
  private currentTween: gsap.core.Tween | null = null;

  constructor(camera: THREE.Camera, controls: any) {
    this.camera = camera;
    this.controls = controls;
  }

  /**
   * Smoothly animate camera to a preset location
   */
  animateToPreset(
    preset: CameraPreset, 
    options: AnimationOptions = {}
  ): Promise<void> {
    return this.animateToPositionAndTarget(
      preset.position.x,
      preset.position.y,
      preset.position.z,
      preset.target.x,
      preset.target.y,
      preset.target.z,
      options
    );
  }

  /**
   * Smoothly animate camera to specific position and target
   */
  animateToPositionAndTarget(
    posX: number,
    posY: number,
    posZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    options: AnimationOptions = {}
  ): Promise<void> {
    const {
      duration = 1.5,
      ease = "power2.inOut",
      onUpdate,
      onComplete
    } = options;

    // Kill any existing animation
    this.stopAnimation();

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.currentTween = null;
          this.controls.update();
          
          if (onComplete) {
            onComplete();
          }
          
          resolve();
        }
      });

      // Animate camera position and target simultaneously
      timeline.to(this.camera.position, {
        x: posX,
        y: posY,
        z: posZ,
        duration,
        ease,
        onUpdate: () => {
          if (onUpdate) {
            onUpdate();
          }
        }
      }, 0);

      timeline.to(this.controls.target, {
        x: targetX,
        y: targetY,
        z: targetZ,
        duration,
        ease,
        onUpdate: () => {
          this.controls.update();
        }
      }, 0);

      this.currentTween = timeline as any;
    });
  }

  /**
   * Smoothly animate camera to specific coordinates
   */
  animateToPosition(
    x: number,
    y: number,
    z: number,
    options: AnimationOptions = {}
  ): Promise<void> {
    const {
      duration = 1.5,
      ease = "power2.inOut",
      onUpdate,
      onComplete
    } = options;

    // Kill any existing animation
    this.stopAnimation();

    return new Promise((resolve) => {
      this.currentTween = gsap.to(this.camera.position, {
        x,
        y,
        z,
        duration,
        ease,
        onUpdate: () => {
          // Call custom update callback if provided
          if (onUpdate) {
            onUpdate();
          }
        },
        onComplete: () => {
          this.currentTween = null;
          
          // Call custom complete callback if provided
          if (onComplete) {
            onComplete();
          }
          
          resolve();
        }
      });
    });
  }

  /**
   * Animate camera with custom easing curves for different movement types
   */
  animateWithStyle(
    preset: CameraPreset,
    style: 'smooth' | 'bounce' | 'elastic' | 'fast' = 'smooth'
  ): Promise<void> {
    const styleOptions: Record<string, AnimationOptions> = {
      smooth: {
        duration: 1.5,
        ease: "power2.inOut"
      },
      bounce: {
        duration: 2.0,
        ease: "bounce.out"
      },
      elastic: {
        duration: 2.5,
        ease: "elastic.out(1, 0.3)"
      },
      fast: {
        duration: 0.8,
        ease: "power3.out"
      }
    };

    return this.animateToPreset(preset, styleOptions[style]);
  }

  /**
   * Stop any current camera animation
   */
  stopAnimation(): void {
    if (this.currentTween) {
      this.currentTween.kill();
      this.currentTween = null;
    }
  }

  /**
   * Check if camera is currently animating
   */
  isAnimating(): boolean {
    return this.currentTween !== null;
  }

  /**
   * Animate camera along a curved path (for more cinematic movements)
   */
  animateAlongPath(
    waypoints: THREE.Vector3[],
    options: AnimationOptions = {}
  ): Promise<void> {
    const {
      duration = 3.0,
      ease = "power2.inOut",
      onUpdate,
      onComplete
    } = options;

    this.stopAnimation();

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.currentTween = null;
          if (onComplete) onComplete();
          resolve();
        }
      });

      // Create smooth path through waypoints
      waypoints.forEach((waypoint, index) => {
        if (index === 0) return; // Skip first waypoint (current position)
        
        const segmentDuration = duration / (waypoints.length - 1);
        
        timeline.to(this.camera.position, {
          x: waypoint.x,
          y: waypoint.y,
          z: waypoint.z,
          duration: segmentDuration,
          ease: index === waypoints.length - 1 ? ease : "power1.inOut",
          onUpdate: onUpdate
        });
      });

      this.currentTween = timeline as any;
    });
  }

  /**
   * Create a smooth orbital movement to a position
   */
  orbitToPosition(
    targetX: number,
    targetY: number,
    targetZ: number,
    options: AnimationOptions = {}
  ): Promise<void> {
    const currentPos = this.camera.position.clone();
    const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
    
    // Calculate midpoint for orbital movement
    const midpoint = currentPos.clone().lerp(targetPos, 0.5);
    midpoint.y += Math.abs(targetPos.distanceTo(currentPos)) * 0.3; // Arc height
    
    const waypoints = [
      currentPos,
      midpoint,
      targetPos
    ];

    return this.animateAlongPath(waypoints, {
      duration: 2.0,
      ease: "power2.inOut",
      ...options
    });
  }

  /**
   * Dispose of the animator and clean up resources
   */
  dispose(): void {
    this.stopAnimation();
  }
}

// Utility function to create animator instance
export function createCameraAnimator(camera: THREE.Camera, controls: any): CameraAnimator {
  return new CameraAnimator(camera, controls);
}
