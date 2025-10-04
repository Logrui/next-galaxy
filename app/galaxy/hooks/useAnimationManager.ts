import { useState, useEffect } from 'react';
import { AnimationManager } from '../managers/AnimationManager';

/**
 * Custom React hook to manage the AnimationManager instance.
 * Ensures automatic start/stop of the animation loop with component lifecycle.
 *
 * @param autoStart If true, starts the animation loop on mount. Default: true.
 * @returns The AnimationManager instance.
 */
export function useAnimationManager(autoStart: boolean = true): AnimationManager {
  const [animationManager] = useState(() => new AnimationManager());

  useEffect(() => {
    // Start animation loop if autoStart is enabled
    if (autoStart) {
      animationManager.start();
    }

    // Cleanup: stop animation and dispose on unmount
    return () => {
      animationManager.dispose();
    };
  }, [animationManager, autoStart]);

  return animationManager;
}

