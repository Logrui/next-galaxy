/**
 * GalaxyStateManager - Central State Store
 * 
 * Manages all galaxy visualization state with observer pattern for change notifications.
 * This is the foundation manager - all other managers observe state from here.
 * 
 * @module GalaxyStateManager
 */

import * as THREE from 'three';
import type { 
  GalaxyState, 
  VisualParameters, 
  StateListener, 
  UnsubscribeFunction 
} from '../types';

/**
 * Central state manager for galaxy visualization
 * Implements observer pattern for state change notifications
 */
export class GalaxyStateManager {
  private state: GalaxyState;
  private listeners: Set<StateListener>;

  constructor(initialState?: Partial<GalaxyState>) {
    this.state = this.getDefaultState();
    this.listeners = new Set();

    // Apply any initial state overrides
    if (initialState) {
      this.state = { ...this.state, ...initialState };
    }
  }

  /**
   * Get default initial state
   */
  private getDefaultState(): GalaxyState {
    return {
      cameraPosition: new THREE.Vector3(0, 150, 300),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      interactionMode: 'free',
      currentLocation: null,
      visualParameters: {
        fdAlpha: 0,
        focalDistance: 500,
        aperture: 0,
        nebulaAmp: 0.5,
        superScale: 1.0,
        phaseMix: 0,
        dyingMix: 0,
        pathMode: 0,
      },
      uiPanels: new Map(),
      isInitialized: false,
      loadingProgress: 0,
    };
  }

  /**
   * Get current state (readonly)
   * @returns Current state object (readonly copy)
   */
  public getState(): Readonly<GalaxyState> {
    return this.state;
  }

  /**
   * Update state atomically and notify all listeners
   * @param updates Partial state updates to apply
   */
  public updateState(updates: Partial<GalaxyState>): void {
    // Validate state updates
    if (updates.loadingProgress !== undefined) {
      if (updates.loadingProgress < 0 || updates.loadingProgress > 1) {
        console.warn('loadingProgress must be between 0 and 1');
        updates.loadingProgress = Math.max(0, Math.min(1, updates.loadingProgress));
      }
    }

    if (updates.interactionMode !== undefined) {
      if (updates.interactionMode !== 'fixed' && updates.interactionMode !== 'free') {
        console.error('interactionMode must be "fixed" or "free"');
        return;
      }
    }

    // Validate camera vectors are finite
    if (updates.cameraPosition && !this.isFiniteVector(updates.cameraPosition)) {
      console.error('cameraPosition must have finite values');
      return;
    }

    if (updates.cameraTarget && !this.isFiniteVector(updates.cameraTarget)) {
      console.error('cameraTarget must have finite values');
      return;
    }

    // Atomic state update
    this.state = { ...this.state, ...updates };

    // Notify all listeners
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   * @param listener Callback function called when state changes
   * @returns Unsubscribe function
   */
  public subscribe(listener: StateListener): UnsubscribeFunction {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Set interaction mode (convenience method)
   * @param mode Interaction mode: 'fixed' (locked camera) or 'free' (orbital controls)
   */
  public setInteractionMode(mode: 'fixed' | 'free'): void {
    this.updateState({ interactionMode: mode });
  }

  /**
   * Set current location (convenience method)
   * @param locationId Location identifier or null to clear
   */
  public setLocation(locationId: string | null): void {
    this.updateState({ currentLocation: locationId });
  }

  /**
   * Update visual parameters (convenience method)
   * @param params Partial visual parameters to update
   */
  public updateVisualParameters(params: Partial<VisualParameters>): void {
    const currentParams = this.state.visualParameters;
    const updatedParams = { ...currentParams, ...params };

    // Validate parameter bounds
    updatedParams.fdAlpha = this.clamp(updatedParams.fdAlpha, 0, 1);
    updatedParams.focalDistance = this.clamp(updatedParams.focalDistance, 0, 1000);
    updatedParams.aperture = this.clamp(updatedParams.aperture, 0, 10000);
    updatedParams.nebulaAmp = this.clamp(updatedParams.nebulaAmp, 0, 10);
    updatedParams.superScale = this.clamp(updatedParams.superScale, 0, 10);
    updatedParams.phaseMix = this.clamp(updatedParams.phaseMix, 0, 1);
    updatedParams.dyingMix = this.clamp(updatedParams.dyingMix, 0, 1);
    updatedParams.pathMode = Math.round(this.clamp(updatedParams.pathMode, 0, 7));

    this.updateState({ visualParameters: updatedParams });
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Check if vector has finite values
   */
  private isFiniteVector(vector: THREE.Vector3): boolean {
    return (
      isFinite(vector.x) &&
      isFinite(vector.y) &&
      isFinite(vector.z)
    );
  }

  /**
   * Clamp value to range
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Dispose of manager resources
   * Safe to call multiple times (idempotent)
   */
  public dispose(): void {
    this.listeners.clear();
  }
}

