import { Panel } from '../ui/base/Panel';
import { GalaxyStateManager } from './GalaxyStateManager';
import { SceneManager } from './SceneManager';

/**
 * Coordinates all UI overlay panels with lifecycle management and visibility state.
 * Synchronizes panel visibility with GalaxyStateManager.
 */
export class UIManager {
  private container: HTMLElement;
  private panels: Map<string, Panel> = new Map();
  private stateManager: GalaxyStateManager;
  private sceneManager: SceneManager;

  constructor(
    container: HTMLElement,
    stateManager: GalaxyStateManager,
    sceneManager: SceneManager
  ) {
    this.container = container;
    this.stateManager = stateManager;
    this.sceneManager = sceneManager;
  }

  /**
   * Adds a panel to the manager and registers it in the DOM.
   * @param id Unique identifier for the panel.
   * @param panel Panel instance (must extend Panel base class).
   * @throws Error if panel ID already exists.
   */
  addPanel(id: string, panel: Panel): void {
    if (this.panels.has(id)) {
      console.warn(`[UIManager] Panel with ID "${id}" already exists. Removing old panel.`);
      this.removePanel(id);
    }

    this.panels.set(id, panel);
    
    // Sync initial visibility state with state manager
    const currentState = this.stateManager.getState();
    const isVisible = currentState.uiPanels.get(id) ?? false;
    if (isVisible) {
      panel.show();
    } else {
      panel.hide();
    }
  }

  /**
   * Removes a panel from the manager and destroys it.
   * @param id Panel identifier.
   */
  removePanel(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      panel.destroy();
      this.panels.delete(id);
      this.stateManager.setUIPanelVisibility(id, false);
    }
  }

  /**
   * Shows a panel and updates state.
   * @param id Panel identifier.
   */
  showPanel(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      panel.show();
      this.stateManager.setUIPanelVisibility(id, true);
    } else {
      console.warn(`[UIManager] Attempted to show non-existent panel: "${id}"`);
    }
  }

  /**
   * Hides a panel and updates state.
   * @param id Panel identifier.
   */
  hidePanel(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      panel.hide();
      this.stateManager.setUIPanelVisibility(id, false);
    } else {
      console.warn(`[UIManager] Attempted to hide non-existent panel: "${id}"`);
    }
  }

  /**
   * Toggles a panel's visibility and updates state.
   * @param id Panel identifier.
   */
  togglePanel(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      if (panel.isShown()) {
        this.hidePanel(id);
      } else {
        this.showPanel(id);
      }
    } else {
      console.warn(`[UIManager] Attempted to toggle non-existent panel: "${id}"`);
    }
  }

  /**
   * Gets a panel instance by ID.
   * @param id Panel identifier.
   * @returns Panel instance or undefined if not found.
   */
  getPanel(id: string): Panel | undefined {
    return this.panels.get(id);
  }

  /**
   * Gets all registered panel IDs.
   * @returns Array of panel IDs.
   */
  getPanelIds(): string[] {
    return Array.from(this.panels.keys());
  }

  /**
   * Checks if a panel is currently visible.
   * @param id Panel identifier.
   * @returns True if panel exists and is visible, false otherwise.
   */
  isPanelVisible(id: string): boolean {
    const panel = this.panels.get(id);
    return panel ? panel.isShown() : false;
  }

  /**
   * Hides all panels at once.
   * Useful for location transitions or full-screen modes.
   */
  hideAllPanels(): void {
    this.panels.forEach((panel, id) => {
      if (panel.isShown()) {
        this.hidePanel(id);
      }
    });
  }

  /**
   * Shows all panels that were previously visible.
   */
  showAllPanels(): void {
    this.panels.forEach((panel, id) => {
      const state = this.stateManager.getState();
      const shouldBeVisible = state.uiPanels.get(id) ?? false;
      if (shouldBeVisible && !panel.isShown()) {
        panel.show();
      }
    });
  }

  /**
   * Updates panel positions based on camera state (future: camera-relative positioning).
   * @param _camera Three.js camera instance (reserved for future use).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updatePanelPositions(_camera: THREE.Camera): void {
    // Future implementation for camera-relative positioning
    // For now, panels use fixed positioning
  }

  /**
   * Updates panels for a specific location (future: location-specific panels).
   * @param _locationId Location identifier (reserved for future use).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateForLocation(_locationId: string): void {
    // Future implementation for location-specific panel visibility/content
  }

  /**
   * Disposes of the UI manager and all managed panels.
   * This method is idempotent and safe to call multiple times.
   */
  dispose(): void {
    this.panels.forEach((panel) => {
      panel.destroy();
    });
    this.panels.clear();
  }

  /**
   * Gets the number of registered panels.
   */
  getPanelCount(): number {
    return this.panels.size;
  }
}

