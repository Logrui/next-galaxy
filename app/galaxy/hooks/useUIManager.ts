import { useState, useEffect } from 'react';
import { UIManager } from '../managers/UIManager';
import { GalaxyStateManager } from '../managers/GalaxyStateManager';
import { SceneManager } from '../managers/SceneManager';

/**
 * Custom React hook to manage the UIManager instance.
 * Requires a container element, GalaxyStateManager, and SceneManager.
 *
 * @param container The HTMLElement that will contain the UI panels.
 * @param stateManager The GalaxyStateManager instance.
 * @param sceneManager The SceneManager instance.
 * @returns The UIManager instance, or null if dependencies aren't ready.
 */
export function useUIManager(
  container: HTMLElement | null,
  stateManager: GalaxyStateManager,
  sceneManager: SceneManager | null
): UIManager | null {
  const [uiManager, setUIManager] = useState<UIManager | null>(null);

  useEffect(() => {
    // Only initialize if both container and sceneManager are available
    if (!container || !sceneManager) {
      setUIManager(null);
      return;
    }

    const manager = new UIManager(container, stateManager, sceneManager);
    setUIManager(manager);

    // Cleanup on unmount or dependency change
    return () => {
      manager.dispose();
    };
  }, [container, stateManager, sceneManager]);

  return uiManager;
}

