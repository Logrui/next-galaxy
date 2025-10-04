import { useState, useEffect } from 'react';
import { InteractionManager } from '../managers/InteractionManager';
import { SceneManager } from '../managers/SceneManager';
import { GalaxyStateManager } from '../managers/GalaxyStateManager';

/**
 * Custom React hook to manage the InteractionManager instance.
 * Requires SceneManager and GalaxyStateManager to be initialized first.
 *
 * @param sceneManager The SceneManager instance (must be initialized).
 * @param stateManager The GalaxyStateManager instance.
 * @returns The InteractionManager instance, or null if dependencies aren't ready.
 */
export function useInteractionManager(
  sceneManager: SceneManager | null,
  stateManager: GalaxyStateManager
): InteractionManager | null {
  const [interactionManager, setInteractionManager] = useState<InteractionManager | null>(null);

  useEffect(() => {
    // Only initialize if sceneManager is available
    if (!sceneManager) {
      setInteractionManager(null);
      return;
    }

    const manager = new InteractionManager(sceneManager, stateManager);
    setInteractionManager(manager);

    // Cleanup on unmount or dependency change
    return () => {
      manager.dispose();
    };
  }, [sceneManager, stateManager]);

  return interactionManager;
}

