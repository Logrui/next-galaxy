/**
 * WebGL Context Manager
 * 
 * Manages shared WebGL context between loading screen and galaxy systems.
 * Ensures optimal resource sharing and prevents context loss.
 */

import * as THREE from 'three';

export interface WebGLContextConfig {
  alpha?: boolean;
  antialias?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  preserveDrawingBuffer?: boolean;
}

export class WebGLContextManager {
  private static instance: WebGLContextManager | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private activeContainer: HTMLElement | null = null;
  private subscribers: Set<(renderer: THREE.WebGLRenderer) => void> = new Set();

  private constructor() {}

  /**
   * Get singleton instance of WebGL context manager
   */
  static getInstance(): WebGLContextManager {
    if (!WebGLContextManager.instance) {
      WebGLContextManager.instance = new WebGLContextManager();
    }
    return WebGLContextManager.instance;
  }

  /**
   * Initialize the shared WebGL context
   */
  initialize(container: HTMLElement, config: WebGLContextConfig = {}): THREE.WebGLRenderer {
    if (this.isInitialized && this.renderer) {
      // Move existing canvas to new container if needed
      if (this.activeContainer !== container && this.canvas) {
        this.moveCanvasToContainer(container);
      }
      return this.renderer;
    }

    const defaultConfig: Required<WebGLContextConfig> = {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      ...config
    };

    // Create renderer with shared canvas
    this.renderer = new THREE.WebGLRenderer(defaultConfig);
    this.canvas = this.renderer.domElement;
    
    // Configure renderer
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    
    // Set up canvas styling for overlay compatibility
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'auto';
    
    // Add to container
    container.appendChild(this.canvas);
    this.activeContainer = container;
    
    // Set initial size
    this.resize(container.clientWidth, container.clientHeight);
    
    this.isInitialized = true;
    
    // Notify subscribers
    this.notifySubscribers();
    
    return this.renderer;
  }

  /**
   * Subscribe to renderer availability
   */
  subscribe(callback: (renderer: THREE.WebGLRenderer) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately notify if renderer is available
    if (this.renderer) {
      callback(this.renderer);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get the current renderer instance
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * Get the current canvas element
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Move canvas to a different container
   */
  moveCanvasToContainer(newContainer: HTMLElement): void {
    if (!this.canvas || this.activeContainer === newContainer) return;
    
    // Remove from current container
    if (this.activeContainer?.contains(this.canvas)) {
      this.activeContainer.removeChild(this.canvas);
    }
    
    // Add to new container
    newContainer.appendChild(this.canvas);
    this.activeContainer = newContainer;
    
    // Resize to new container
    this.resize(newContainer.clientWidth, newContainer.clientHeight);
  }

  /**
   * Resize the renderer and canvas
   */
  resize(width: number, height: number): void {
    if (!this.renderer || !this.canvas) return;
    
    this.renderer.setSize(width, height);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  /**
   * Set canvas z-index for layering
   */
  setCanvasLayer(zIndex: number): void {
    if (this.canvas) {
      this.canvas.style.zIndex = zIndex.toString();
    }
  }

  /**
   * Enable/disable pointer events on canvas
   */
  setPointerEvents(enabled: boolean): void {
    if (this.canvas) {
      this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }

  /**
   * Handle window resize events
   */
  handleWindowResize(): void {
    if (this.activeContainer) {
      this.resize(this.activeContainer.clientWidth, this.activeContainer.clientHeight);
    }
  }

  /**
   * Clear the current render target
   */
  clear(): void {
    if (this.renderer) {
      this.renderer.clear();
    }
  }

  /**
   * Render a scene with camera
   */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.renderer) {
      this.renderer.render(scene, camera);
    }
  }

  /**
   * Dispose of the WebGL context and cleanup
   */
  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
      
      if (this.canvas && this.activeContainer?.contains(this.canvas)) {
        this.activeContainer.removeChild(this.canvas);
      }
      
      this.renderer = null;
      this.canvas = null;
      this.activeContainer = null;
      this.isInitialized = false;
      this.subscribers.clear();
    }
  }

  /**
   * Check if WebGL context is available
   */
  isWebGLAvailable(): boolean {
    return this.renderer !== null && this.isInitialized;
  }

  /**
   * Notify all subscribers about renderer availability
   */
  private notifySubscribers(): void {
    if (this.renderer) {
      this.subscribers.forEach(callback => callback(this.renderer!));
    }
  }
}

/**
 * Convenience hook for using WebGL context manager in React components
 */
export function useWebGLContext(container?: HTMLElement | null): {
  renderer: THREE.WebGLRenderer | null;
  contextManager: WebGLContextManager;
  isAvailable: boolean;
} {
  const contextManager = WebGLContextManager.getInstance();
  
  return {
    renderer: contextManager.getRenderer(),
    contextManager,
    isAvailable: contextManager.isWebGLAvailable()
  };
}