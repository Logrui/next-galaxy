import * as THREE from 'three';
import createInputEvents from 'simple-input-events';
import { SceneManager } from './SceneManager';
import { GalaxyStateManager } from './GalaxyStateManager';

/**
 * Manages mouse/keyboard input events, raycasting, and interaction mode switching.
 * Coordinates between 'fixed' mode (camera locked, mouse parallax) and 'free' mode (OrbitControls).
 */
export class InteractionManager {
  private mode: 'fixed' | 'free';
  private mousePosition: THREE.Vector2;
  private raycaster: THREE.Raycaster;
  private sceneManager: SceneManager;
  private stateManager: GalaxyStateManager;
  private inputEvents: ReturnType<typeof createInputEvents> | null = null;
  private eventListeners: Map<string, EventListener> = new Map();
  private isDisposed: boolean = false;

  constructor(sceneManager: SceneManager, stateManager: GalaxyStateManager) {
    this.sceneManager = sceneManager;
    this.stateManager = stateManager;
    this.mousePosition = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();

    // Initialize in free mode by default
    this.mode = 'free';
    this.initialize();
  }

  /**
   * Initializes input event handling.
   * Sets up mouse move tracking and raycaster.
   */
  private initialize(): void {
    const renderer = this.sceneManager.getRenderer();
    const camera = this.sceneManager.getCamera();

    // Initialize simple-input-events for mouse tracking
    this.inputEvents = createInputEvents(renderer.domElement);

    // Mouse move handler
    this.inputEvents.on('move', ({ position }) => {
      const element = renderer.domElement;
      const [x, y] = position;

      // Normalize mouse position to [-1, 1] range
      this.mousePosition.x = (x / element.clientWidth) * 2 - 1;
      this.mousePosition.y = -(y / element.clientHeight) * 2 + 1;

      // Update raycaster for current mouse position
      this.raycaster.setFromCamera(this.mousePosition, camera);

      // In fixed mode, we might want to update additional state
      // (e.g., for parallax effects or hover detection)
      if (this.mode === 'fixed') {
        // Future: Add parallax or hover state updates here
      }
    });

    // Update state manager with current mode
    this.stateManager.setInteractionMode(this.mode);
  }

  /**
   * Sets the interaction mode.
   * @param mode 'fixed' (camera locked) or 'free' (OrbitControls enabled).
   */
  setMode(mode: 'fixed' | 'free'): void {
    if (this.mode === mode) return;

    this.mode = mode;
    const controls = this.sceneManager.getControls();

    if (mode === 'fixed') {
      // Disable OrbitControls in fixed mode
      controls.enabled = false;
    } else {
      // Enable OrbitControls in free mode
      controls.enabled = true;
    }

    // Update state manager
    this.stateManager.setInteractionMode(mode);
  }

  /**
   * Gets the current interaction mode.
   * @returns Current mode ('fixed' or 'free').
   */
  getMode(): 'fixed' | 'free' {
    return this.mode;
  }

  /**
   * Gets the current normalized mouse position.
   * @returns THREE.Vector2 with x, y in [-1, 1] range.
   */
  getMousePosition(): THREE.Vector2 {
    return this.mousePosition.clone();
  }

  /**
   * Performs raycasting against provided objects.
   * @param objects Array of Three.js objects to test intersections against.
   * @returns Array of intersection results sorted by distance.
   */
  getIntersections(objects: THREE.Object3D[]): THREE.Intersection[] {
    const camera = this.sceneManager.getCamera();
    this.raycaster.setFromCamera(this.mousePosition, camera);
    return this.raycaster.intersectObjects(objects, true); // recursive = true
  }

  /**
   * Adds a custom event listener to the renderer's DOM element.
   * Useful for additional custom interactions.
   * @param eventName DOM event name (e.g., 'click', 'keydown').
   * @param listener Event listener function.
   */
  addEventListener(eventName: string, listener: EventListener): void {
    const element = this.sceneManager.getRenderer().domElement;
    element.addEventListener(eventName, listener);
    this.eventListeners.set(eventName, listener);
  }

  /**
   * Removes a custom event listener.
   * @param eventName DOM event name.
   */
  removeEventListener(eventName: string): void {
    const listener = this.eventListeners.get(eventName);
    if (listener) {
      const element = this.sceneManager.getRenderer().domElement;
      element.removeEventListener(eventName, listener);
      this.eventListeners.delete(eventName);
    }
  }

  /**
   * Disposes of the interaction manager and cleans up all event listeners.
   * This method is idempotent and safe to call multiple times.
   */
  dispose(): void {
    if (this.isDisposed) return;

    // Dispose of input events
    if (this.inputEvents) {
      this.inputEvents.dispose();
      this.inputEvents = null;
    }

    // Remove all custom event listeners
    const element = this.sceneManager.getRenderer().domElement;
    this.eventListeners.forEach((listener, eventName) => {
      element.removeEventListener(eventName, listener);
    });
    this.eventListeners.clear();

    // Re-enable controls if they were disabled
    const controls = this.sceneManager.getControls();
    if (controls) {
      controls.enabled = true;
    }

    this.isDisposed = true;
  }
}

