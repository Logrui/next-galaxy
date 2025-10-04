/**
 * useSceneManager Hook
 * 
 * React hook for managing SceneManager lifecycle.
 * Creates manager when container is available and handles window resize.
 * 
 * @module useSceneManager
 */

import { useEffect, useState, useRef, RefObject } from 'react';
import { SceneManager } from '../managers/SceneManager';

/**
 * Hook to create and manage SceneManager lifecycle
 * 
 * @param containerRef Ref to the container element for the renderer
 * @returns SceneManager instance or null if container not ready
 * 
 * @example
 * ```tsx
 * function GalaxyCanvas() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const sceneManager = useSceneManager(containerRef);
 *   
 *   return <div ref={containerRef} />;
 * }
 * ```
 */
export function useSceneManager(
  containerRef: RefObject<HTMLDivElement>
): SceneManager | null {
  const [manager, setManager] = useState<SceneManager | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize manager when container is available
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const sceneManager = new SceneManager(containerRef.current);
    setManager(sceneManager);

    // Cleanup on unmount
    return () => {
      sceneManager.dispose();
      setManager(null);
    };
  }, [containerRef]);

  // Handle window resize
  useEffect(() => {
    if (!manager || !containerRef.current) {
      return;
    }

    const handleResize = () => {
      // Debounce resize events
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          manager.resize(width, height);
        }
      }, 100); // 100ms debounce
    };

    // Initial resize
    handleResize();

    // Listen for window resize events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [manager, containerRef]);

  return manager;
}

