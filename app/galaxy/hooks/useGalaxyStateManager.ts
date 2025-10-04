/**
 * useGalaxyStateManager Hook
 * 
 * React hook for managing GalaxyStateManager lifecycle.
 * Creates manager instance on mount and handles cleanup on unmount.
 * 
 * @module useGalaxyStateManager
 */

import { useEffect, useState } from 'react';
import { GalaxyStateManager } from '../managers/GalaxyStateManager';
import type { GalaxyState } from '../types';

/**
 * Hook to create and manage GalaxyStateManager lifecycle
 * 
 * @param initialState Optional initial state overrides
 * @returns GalaxyStateManager instance
 * 
 * @example
 * ```tsx
 * function GalaxyCanvas() {
 *   const stateManager = useGalaxyStateManager();
 *   
 *   // Use state manager
 *   const state = stateManager.getState();
 *   
 *   return <div>Galaxy Canvas</div>;
 * }
 * ```
 */
export function useGalaxyStateManager(
  initialState?: Partial<GalaxyState>
): GalaxyStateManager {
  const [manager] = useState(() => new GalaxyStateManager(initialState));

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      manager.dispose();
    };
  }, [manager]);

  return manager;
}

