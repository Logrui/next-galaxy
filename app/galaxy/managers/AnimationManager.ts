import * as THREE from 'three';
import { FrameCallback } from '../types';

/**
 * Manages the main animation loop and coordinates frame callbacks from multiple subsystems.
 * Ensures a single requestAnimationFrame loop for all time-based updates.
 */
export class AnimationManager {
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private frameCallbacks: Set<FrameCallback> = new Set();
  private clock: THREE.Clock;
  private maxDeltaTime: number = 0.1; // Cap at 100ms to prevent time jumps

  constructor() {
    this.clock = new THREE.Clock(false); // Don't autostart
  }

  /**
   * Starts the animation loop.
   * If already running, this is a no-op.
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  /**
   * Stops the animation loop completely.
   * Resets the clock state.
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clock.stop();
  }

  /**
   * Pauses the animation loop without resetting the clock.
   * Resume with resume() to continue from where it left off.
   */
  pause(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clock keeps running to maintain delta time accuracy
  }

  /**
   * Resumes the animation loop after pause().
   */
  resume(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.animate();
  }

  /**
   * Main animation loop executed via requestAnimationFrame.
   * Calculates delta time and executes all registered callbacks.
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    const frameStartTime = performance.now();
    let deltaTime = this.clock.getDelta();

    // Cap delta time to prevent physics explosions on tab switch
    deltaTime = Math.min(deltaTime, this.maxDeltaTime);

    // Execute all registered callbacks
    this.frameCallbacks.forEach(callback => {
      try {
        callback(deltaTime);
      } catch (error) {
        console.error('[AnimationManager] Frame callback error:', error);
      }
    });

    // Frame budget monitoring (warn if callbacks exceed 16ms)
    const frameTime = performance.now() - frameStartTime;
    if (frameTime > 16) {
      console.warn(
        `[AnimationManager] Frame budget exceeded: ${frameTime.toFixed(2)}ms (callbacks: ${this.frameCallbacks.size})`
      );
    }

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  /**
   * Registers a frame callback to be executed on each animation frame.
   * @param callback Function receiving deltaTime in seconds.
   * @returns Unsubscribe function to remove the callback.
   */
  addFrameCallback(callback: FrameCallback): () => void {
    this.frameCallbacks.add(callback);
    return () => this.removeFrameCallback(callback);
  }

  /**
   * Removes a registered frame callback.
   * @param callback The callback function to remove.
   */
  removeFrameCallback(callback: FrameCallback): void {
    this.frameCallbacks.delete(callback);
  }

  /**
   * Checks if the animation loop is currently running.
   * @returns True if animating, false otherwise.
   */
  isAnimating(): boolean {
    return this.isRunning;
  }

  /**
   * Disposes of the animation manager and stops all callbacks.
   * This method is idempotent and safe to call multiple times.
   */
  dispose(): void {
    this.stop();
    this.frameCallbacks.clear();
  }

  /**
   * Gets the current number of registered frame callbacks.
   * Useful for debugging and monitoring.
   */
  getCallbackCount(): number {
    return this.frameCallbacks.size;
  }

  /**
   * Sets the maximum allowed delta time (in seconds) to prevent physics explosions.
   * Default is 0.1 (100ms).
   * @param maxDelta Maximum delta time in seconds.
   */
  setMaxDeltaTime(maxDelta: number): void {
    this.maxDeltaTime = Math.max(0, maxDelta);
  }
}

