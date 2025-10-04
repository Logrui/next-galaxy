import gsap from 'gsap';
import { GalaxyStateManager } from './GalaxyStateManager';
import { VisualParameters } from '../types';

/**
 * Manages visual shader parameters with support for smooth GSAP-powered transitions.
 * Synchronizes parameter state with Three.js shader uniforms.
 */
/**
 * Three.js shader uniforms type (external library structure).
 */
type ShaderUniforms = Record<string, { value: unknown }>;

export class ParameterManager {
  private uniforms: ShaderUniforms;
  private currentParameters: VisualParameters;
  private stateManager: GalaxyStateManager;
  private activeTransitions: gsap.core.Tween[] = [];

  /**
   * Parameter bounds for validation.
   */
  private readonly PARAMETER_BOUNDS: Record<keyof VisualParameters, { min: number; max: number; isInteger?: boolean }> = {
    fdAlpha: { min: 0, max: 1 },
    focalDistance: { min: 0, max: 1000 },
    aperture: { min: 0, max: 10000 },
    nebulaAmp: { min: 0, max: 10 },
    phaseMix: { min: 0, max: 1 },
    dyingMix: { min: 0, max: 1 },
    pathMode: { min: 0, max: 7, isInteger: true },
    superScale: { min: 0, max: 10 },
  };

  constructor(uniforms: ShaderUniforms, stateManager: GalaxyStateManager) {
    this.uniforms = uniforms;
    this.stateManager = stateManager;

    // Initialize from state manager
    const initialState = stateManager.getState();
    this.currentParameters = { ...initialState.visualParameters };

    // Sync uniforms with initial parameters
    this.syncUniformsWithParameters();
  }

  /**
   * Validates and clamps a parameter value to its bounds.
   * @param key Parameter name.
   * @param value Raw value.
   * @returns Clamped and validated value.
   */
  private validateParameter(key: keyof VisualParameters, value: number): number {
    const bounds = this.PARAMETER_BOUNDS[key];
    if (!bounds) return value;

    let validated = Math.max(bounds.min, Math.min(bounds.max, value));

    // Integer constraint for pathMode
    if (bounds.isInteger) {
      validated = Math.round(validated);
    }

    return validated;
  }

  /**
   * Immediately sets visual parameters without animation.
   * Updates both internal state and Three.js uniforms.
   * @param parameters Partial visual parameters to update.
   */
  setParameters(parameters: Partial<VisualParameters>): void {
    // Validate and apply parameters
    Object.entries(parameters).forEach(([key, value]) => {
      const paramKey = key as keyof VisualParameters;
      if (typeof value === 'number') {
        this.currentParameters[paramKey] = this.validateParameter(paramKey, value);
      }
    });

    // Sync uniforms
    this.syncUniformsWithParameters();

    // Update state manager
    this.stateManager.updateVisualParameters(this.currentParameters);
  }

  /**
   * Gets the current visual parameters.
   * @returns Current VisualParameters object.
   */
  getParameters(): Readonly<VisualParameters> {
    return { ...this.currentParameters };
  }

  /**
   * Gets the Three.js shader uniforms object.
   * @returns Uniforms object.
   */
  getUniforms(): ShaderUniforms {
    return this.uniforms;
  }

  /**
   * Smoothly transitions to target parameters using GSAP animation.
   * @param targetParameters Partial visual parameters to transition to.
   * @param duration Transition duration in milliseconds. Default: 2000ms.
   * @param easing GSAP easing function. Default: 'power2.inOut'.
   * @returns Promise that resolves when transition completes.
   */
  transitionToParameters(
    targetParameters: Partial<VisualParameters>,
    duration: number = 2000,
    easing: string = 'power2.inOut'
  ): Promise<void> {
    return new Promise((resolve) => {
      // Kill any active transitions to prevent conflicts
      this.activeTransitions.forEach(tween => tween.kill());
      this.activeTransitions = [];

      // Validate target parameters
      const validatedTargets: Partial<VisualParameters> = {};
      Object.entries(targetParameters).forEach(([key, value]) => {
        const paramKey = key as keyof VisualParameters;
        if (typeof value === 'number') {
          validatedTargets[paramKey] = this.validateParameter(paramKey, value);
        }
      });

      // Create GSAP tween for smooth transition
      const tween = gsap.to(this.currentParameters, {
        ...validatedTargets,
        duration: duration / 1000, // GSAP uses seconds
        ease: easing,
        onUpdate: () => {
          this.syncUniformsWithParameters();
          this.stateManager.updateVisualParameters(this.currentParameters);
        },
        onComplete: () => {
          this.syncUniformsWithParameters();
          this.stateManager.updateVisualParameters(this.currentParameters);
          this.activeTransitions = this.activeTransitions.filter(t => t !== tween);
          resolve();
        },
      });

      this.activeTransitions.push(tween);
    });
  }

  /**
   * Synchronizes Three.js shader uniforms with current parameter state.
   * Maps VisualParameters to the actual uniform structure.
   */
  private syncUniformsWithParameters(): void {
    // Map parameters to uniforms (adjust based on actual uniform names in shaders)
    if (this.uniforms.fdAlpha) this.uniforms.fdAlpha.value = this.currentParameters.fdAlpha;
    if (this.uniforms.focalDistance) this.uniforms.focalDistance.value = this.currentParameters.focalDistance;
    if (this.uniforms.aperture) this.uniforms.aperture.value = this.currentParameters.aperture;
    if (this.uniforms.nebulaAmp) this.uniforms.nebulaAmp.value = this.currentParameters.nebulaAmp;
    if (this.uniforms.phaseMix) this.uniforms.phaseMix.value = this.currentParameters.phaseMix;
    if (this.uniforms.dyingMix) this.uniforms.dyingMix.value = this.currentParameters.dyingMix;
    if (this.uniforms.pathMode) this.uniforms.pathMode.value = this.currentParameters.pathMode;
    if (this.uniforms.superScale) this.uniforms.superScale.value = this.currentParameters.superScale;
  }

  /**
   * Disposes of the parameter manager and cancels all active transitions.
   * This method is idempotent and safe to call multiple times.
   */
  dispose(): void {
    // Kill all active GSAP transitions
    this.activeTransitions.forEach(tween => tween.kill());
    this.activeTransitions = [];
  }

  /**
   * Gets the number of currently active parameter transitions.
   * Useful for debugging and ensuring transitions complete.
   */
  getActiveTransitionCount(): number {
    return this.activeTransitions.length;
  }

  /**
   * Cancels all active transitions and returns to current state.
   */
  cancelTransitions(): void {
    this.activeTransitions.forEach(tween => tween.kill());
    this.activeTransitions = [];
    this.syncUniformsWithParameters();
  }
}

