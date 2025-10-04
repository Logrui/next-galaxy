import { useState, useEffect } from 'react';
import { ParameterManager } from '../managers/ParameterManager';
import { GalaxyStateManager } from '../managers/GalaxyStateManager';

/**
 * Three.js shader uniforms type (external library structure).
 */
type ShaderUniforms = Record<string, { value: unknown }>;

/**
 * Custom React hook to manage the ParameterManager instance.
 * Requires uniforms object (from ShaderMaterial) and GalaxyStateManager.
 *
 * @param uniforms Three.js ShaderMaterial uniforms object.
 * @param stateManager The GalaxyStateManager instance.
 * @returns The ParameterManager instance, or null if dependencies aren't ready.
 */
export function useParameterManager(
  uniforms: ShaderUniforms | null,
  stateManager: GalaxyStateManager
): ParameterManager | null {
  const [parameterManager, setParameterManager] = useState<ParameterManager | null>(null);

  useEffect(() => {
    // Only initialize if uniforms are available
    if (!uniforms) {
      setParameterManager(null);
      return;
    }

    const manager = new ParameterManager(uniforms, stateManager);
    setParameterManager(manager);

    // Cleanup on unmount or dependency change
    return () => {
      manager.dispose();
    };
  }, [uniforms, stateManager]);

  return parameterManager;
}

