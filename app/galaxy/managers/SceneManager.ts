/**
 * SceneManager - Three.js Resource Lifecycle Management
 * 
 * Manages Three.js scene, renderer, camera, and controls with centralized
 * resource tracking and disposal to prevent memory leaks.
 * 
 * @module SceneManager
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Scene manager for Three.js resource lifecycle
 * Provides centralized resource tracking and disposal
 */
export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private materials: Map<string, THREE.Material>;
  private geometries: Map<string, THREE.BufferGeometry>;
  private container: HTMLElement;
  private isDisposed: boolean;

  constructor(container: HTMLElement) {
    this.container = container;
    this.materials = new Map();
    this.geometries = new Map();
    this.isDisposed = false;

    // Initialize Three.js components
    this.renderer = this.initializeRenderer();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.controls = this.initializeControls();

    // Append renderer to container
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Initialize WebGL renderer
   */
  private initializeRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    // Set renderer properties
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return renderer;
  }

  /**
   * Initialize scene
   */
  private initializeScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f); // Deep space black
    return scene;
  }

  /**
   * Initialize camera
   */
  private initializeCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60, // FOV
      this.container.clientWidth / this.container.clientHeight, // Aspect ratio
      0.1, // Near plane
      10000 // Far plane
    );

    // Set default camera position
    camera.position.set(0, 150, 300);
    camera.lookAt(0, 0, 0);

    return camera;
  }

  /**
   * Initialize orbit controls
   */
  private initializeControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Configure controls
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 2000;
    controls.maxPolarAngle = Math.PI;

    return controls;
  }

  /**
   * Get renderer instance
   * @returns WebGL renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get scene instance
   * @returns Three.js scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get camera instance
   * @returns Perspective camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get orbit controls instance
   * @returns Orbit controls
   */
  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Register and track a material for automatic disposal
   * @param name Unique identifier for the material
   * @param material Material to register
   */
  public addMaterial(name: string, material: THREE.Material): void {
    if (this.materials.has(name)) {
      console.warn(`Material "${name}" already registered, replacing`);
      const existing = this.materials.get(name);
      existing?.dispose();
    }
    this.materials.set(name, material);
  }

  /**
   * Get a registered material by name
   * @param name Material identifier
   * @returns Material or undefined if not found
   */
  public getMaterial(name: string): THREE.Material | undefined {
    return this.materials.get(name);
  }

  /**
   * Register and track a geometry for automatic disposal
   * @param name Unique identifier for the geometry
   * @param geometry Geometry to register
   */
  public addGeometry(name: string, geometry: THREE.BufferGeometry): void {
    if (this.geometries.has(name)) {
      console.warn(`Geometry "${name}" already registered, replacing`);
      const existing = this.geometries.get(name);
      existing?.dispose();
    }
    this.geometries.set(name, geometry);
  }

  /**
   * Get a registered geometry by name
   * @param name Geometry identifier
   * @returns Geometry or undefined if not found
   */
  public getGeometry(name: string): THREE.BufferGeometry | undefined {
    return this.geometries.get(name);
  }

  /**
   * Handle window resize
   * @param width New width
   * @param height New height
   */
  public resize(width: number, height: number): void {
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(width, height);
  }

  /**
   * Dispose of all resources
   * Safe to call multiple times (idempotent)
   */
  public dispose(): void {
    if (this.isDisposed) {
      return; // Already disposed
    }

    // Dispose all registered materials
    this.materials.forEach((material) => {
      material.dispose();
    });
    this.materials.clear();

    // Dispose all registered geometries
    this.geometries.forEach((geometry) => {
      geometry.dispose();
    });
    this.geometries.clear();

    // Dispose controls
    this.controls.dispose();

    // Dispose renderer
    this.renderer.dispose();

    // Remove renderer DOM element
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    // Clear scene
    this.scene.clear();

    this.isDisposed = true;
  }

  /**
   * Check if manager has been disposed
   * @returns True if disposed
   */
  public isResourceDisposed(): boolean {
    return this.isDisposed;
  }
}

