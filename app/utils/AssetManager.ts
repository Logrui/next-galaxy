/**
 * Asset Manager - Centralized Asset Loading and Preloading
 * 
 * Manages all asset loading for the loading screen and galaxy systems.
 * Provides preloading, caching, and error handling for optimal performance.
 */

import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export interface AssetDefinition {
  key: string;
  path: string;
  type: 'texture' | 'audio' | 'data' | 'font';
  required: boolean;
  preload: boolean;
}

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset?: string;
  error?: string;
}

export interface LoadedAssets {
  textures: Map<string, THREE.Texture>;
  audio: Map<string, HTMLAudioElement>;
  data: Map<string, any>;
  fonts: Map<string, FontFace>;
}

export class AssetManager {
  private static instance: AssetManager | null = null;
  private assets: LoadedAssets = {
    textures: new Map(),
    audio: new Map(),
    data: new Map(),
    fonts: new Map()
  };
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private progressCallbacks: Set<(progress: AssetLoadProgress) => void> = new Set();
  private textureLoader = new THREE.TextureLoader();
  private exrLoader = new EXRLoader();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Asset definitions for the application
   */
  private static assetDefinitions: AssetDefinition[] = [
    // Galaxy textures
    {
      key: 'scale-texture',
      path: '/scale-texture.png',
      type: 'texture',
      required: true,
      preload: true
    },
    {
      key: 'color-tiles',
      path: '/color-tiles.png', 
      type: 'texture',
      required: true,
      preload: true
    },
    {
      key: 'ani-tiles',
      path: '/ani-tiles.exr',
      type: 'texture',
      required: true,
      preload: true
    },
    
    // Audio assets (optional)
    {
      key: 'ambient-space',
      path: '/audio/ambient-space.mp3',
      type: 'audio',
      required: false,
      preload: false
    },
    {
      key: 'particle-whoosh',
      path: '/audio/particle-whoosh.mp3',
      type: 'audio',
      required: false,
      preload: false
    },
    {
      key: 'transition-sound',
      path: '/audio/transition.mp3',
      type: 'audio',
      required: false,
      preload: false
    },
    
    // Fonts
    {
      key: 'avenir-next-medium',
      path: '/fonts/Avenir-Next-Medium_2.woff',
      type: 'font',
      required: false,
      preload: true
    },
    {
      key: 'avenir-pro-roman',
      path: '/fonts/Avenir-Pro-Roman.woff',
      type: 'font',
      required: false,
      preload: true
    },
    {
      key: 'neusa',
      path: '/fonts/Neusa.woff',
      type: 'font',
      required: false,
      preload: true
    }
  ];

  /**
   * Subscribe to loading progress updates
   */
  onProgress(callback: (progress: AssetLoadProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Preload all assets marked for preloading
   */
  async preloadAssets(): Promise<void> {
    const preloadAssets = AssetManager.assetDefinitions.filter(asset => asset.preload);
    await this.loadAssets(preloadAssets);
  }

  /**
   * Load essential assets required for the application
   */
  async loadEssentialAssets(): Promise<void> {
    const essentialAssets = AssetManager.assetDefinitions.filter(asset => asset.required);
    await this.loadAssets(essentialAssets);
  }

  /**
   * Load a specific set of assets
   */
  async loadAssets(assetDefinitions: AssetDefinition[]): Promise<void> {
    const loadPromises = assetDefinitions.map(asset => this.loadAsset(asset));
    
    let loaded = 0;
    const total = assetDefinitions.length;
    
    // Track progress
    const trackProgress = async (promise: Promise<any>, asset: AssetDefinition) => {
      try {
        await promise;
        loaded++;
        this.notifyProgress({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          currentAsset: asset.key
        });
      } catch (error) {
        loaded++;
        const errorMessage = `Failed to load ${asset.key}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        if (asset.required) {
          throw new Error(errorMessage);
        }
        
        console.warn(errorMessage);
        this.notifyProgress({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          currentAsset: asset.key,
          error: errorMessage
        });
      }
    };

    await Promise.all(loadPromises.map((promise, index) => 
      trackProgress(promise, assetDefinitions[index])
    ));
  }

  /**
   * Load a single asset
   */
  async loadAsset(asset: AssetDefinition): Promise<any> {
    // Return cached promise if already loading
    if (this.loadingPromises.has(asset.key)) {
      return this.loadingPromises.get(asset.key);
    }

    // Return cached asset if already loaded
    const cached = this.getCachedAsset(asset);
    if (cached) {
      return cached;
    }

    // Create loading promise
    const promise = this.createLoadPromise(asset);
    this.loadingPromises.set(asset.key, promise);

    try {
      const result = await promise;
      this.cacheAsset(asset, result);
      this.loadingPromises.delete(asset.key);
      return result;
    } catch (error) {
      this.loadingPromises.delete(asset.key);
      throw error;
    }
  }

  /**
   * Get cached asset if exists
   */
  private getCachedAsset(asset: AssetDefinition): any {
    switch (asset.type) {
      case 'texture':
        return this.assets.textures.get(asset.key);
      case 'audio':
        return this.assets.audio.get(asset.key);
      case 'data':
        return this.assets.data.get(asset.key);
      case 'font':
        return this.assets.fonts.get(asset.key);
      default:
        return null;
    }
  }

  /**
   * Cache loaded asset
   */
  private cacheAsset(asset: AssetDefinition, result: any): void {
    switch (asset.type) {
      case 'texture':
        this.assets.textures.set(asset.key, result);
        break;
      case 'audio':
        this.assets.audio.set(asset.key, result);
        break;
      case 'data':
        this.assets.data.set(asset.key, result);
        break;
      case 'font':
        this.assets.fonts.set(asset.key, result);
        break;
    }
  }

  /**
   * Create loading promise based on asset type
   */
  private createLoadPromise(asset: AssetDefinition): Promise<any> {
    switch (asset.type) {
      case 'texture':
        return this.loadTexture(asset);
      case 'audio':
        return this.loadAudio(asset);
      case 'data':
        return this.loadData(asset);
      case 'font':
        return this.loadFont(asset);
      default:
        throw new Error(`Unsupported asset type: ${asset.type}`);
    }
  }

  /**
   * Load texture asset
   */
  private loadTexture(asset: AssetDefinition): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const isEXR = asset.path.endsWith('.exr');
      const loader = isEXR ? this.exrLoader : this.textureLoader;
      
      loader.load(
        asset.path,
        (texture) => {
          // Configure texture settings
          if (!isEXR) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
          }
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Load audio asset
   */
  private loadAudio(asset: AssetDefinition): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
      audio.addEventListener('error', reject, { once: true });
      
      audio.preload = 'auto';
      audio.src = asset.path;
    });
  }

  /**
   * Load data asset (JSON, etc.)
   */
  private loadData(asset: AssetDefinition): Promise<any> {
    return fetch(asset.path).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    });
  }

  /**
   * Load font asset
   */
  private loadFont(asset: AssetDefinition): Promise<FontFace> {
    const fontName = asset.key.replace(/-/g, ' ');
    const font = new FontFace(fontName, `url(${asset.path})`);
    
    return font.load().then(loadedFont => {
      document.fonts.add(loadedFont);
      return loadedFont;
    });
  }

  /**
   * Get loaded texture
   */
  getTexture(key: string): THREE.Texture | null {
    return this.assets.textures.get(key) || null;
  }

  /**
   * Get loaded audio
   */
  getAudio(key: string): HTMLAudioElement | null {
    return this.assets.audio.get(key) || null;
  }

  /**
   * Get loaded data
   */
  getData(key: string): any {
    return this.assets.data.get(key) || null;
  }

  /**
   * Get loaded font
   */
  getFont(key: string): FontFace | null {
    return this.assets.fonts.get(key) || null;
  }

  /**
   * Check if asset is loaded
   */
  isLoaded(key: string): boolean {
    return this.assets.textures.has(key) ||
           this.assets.audio.has(key) ||
           this.assets.data.has(key) ||
           this.assets.fonts.has(key);
  }

  /**
   * Get all loaded assets
   */
  getAllAssets(): LoadedAssets {
    return this.assets;
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgress(progress: AssetLoadProgress): void {
    this.progressCallbacks.forEach(callback => callback(progress));
  }

  /**
   * Clear all cached assets and dispose of resources
   */
  dispose(): void {
    // Dispose textures
    this.assets.textures.forEach(texture => texture.dispose());
    this.assets.textures.clear();

    // Audio elements don't need explicit disposal
    this.assets.audio.clear();
    
    // Clear other assets
    this.assets.data.clear();
    this.assets.fonts.clear();
    
    // Clear loading promises
    this.loadingPromises.clear();
    
    // Clear callbacks
    this.progressCallbacks.clear();
  }
}

/**
 * Convenience functions for common operations
 */
export function getAssetManager(): AssetManager {
  return AssetManager.getInstance();
}

export function preloadAssets(): Promise<void> {
  return getAssetManager().preloadAssets();
}

export function loadEssentialAssets(): Promise<void> {
  return getAssetManager().loadEssentialAssets();
}