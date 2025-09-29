/**
 * Performance Configuration - Particle Count Management
 * 
 * Manages particle count limits and performance settings based on device capabilities
 * and real-time performance monitoring.
 */

export interface DeviceCapabilities {
  tier: 'low' | 'medium' | 'high';
  maxParticles: number;
  pixelRatio: number;
  antialiasing: boolean;
  webglExtensions: string[];
  memoryLimit: number; // MB
}

export interface ParticleConfig {
  baseCount: number;
  maxCount: number;
  minCount: number;
  adaptiveScaling: boolean;
  qualityTiers: {
    low: number;
    medium: number;
    high: number;
  };
}

export class PerformanceConfig {
  private static instance: PerformanceConfig | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private particleConfig: ParticleConfig;

  private constructor() {
    this.particleConfig = {
      baseCount: 32768, // Target for high-end devices
      maxCount: 65536,  // Absolute maximum
      minCount: 4096,   // Minimum for functionality
      adaptiveScaling: true,
      qualityTiers: {
        low: 8192,     // Low-end devices
        medium: 16384, // Mid-range devices
        high: 32768    // High-end devices
      }
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceConfig {
    if (!PerformanceConfig.instance) {
      PerformanceConfig.instance = new PerformanceConfig();
    }
    return PerformanceConfig.instance;
  }

  /**
   * Detect device capabilities
   */
  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.deviceCapabilities) {
      return this.deviceCapabilities;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl || !('getSupportedExtensions' in gl)) {
      throw new Error('WebGL not supported');
    }

    const webglContext = gl as WebGLRenderingContext;
    
    // Get WebGL extensions
    const extensions = webglContext.getSupportedExtensions() || [];
    
    // Estimate device tier based on various factors
    const deviceTier = this.estimateDeviceTier(webglContext, extensions);
    
    // Set capabilities based on tier
    const capabilities: DeviceCapabilities = {
      tier: deviceTier,
      maxParticles: this.particleConfig.qualityTiers[deviceTier],
      pixelRatio: this.getOptimalPixelRatio(deviceTier),
      antialiasing: deviceTier !== 'low',
      webglExtensions: extensions,
      memoryLimit: this.getMemoryLimit(deviceTier)
    };

    this.deviceCapabilities = capabilities;
    return capabilities;
  }

  /**
   * Get optimal particle count for current device
   */
  getOptimalParticleCount(): number {
    if (!this.deviceCapabilities) {
      // Return conservative default if capabilities not detected yet
      return this.particleConfig.qualityTiers.medium;
    }

    return this.deviceCapabilities.maxParticles;
  }

  /**
   * Get particle count for specific quality level
   */
  getParticleCountForQuality(quality: 'low' | 'medium' | 'high'): number {
    return this.particleConfig.qualityTiers[quality];
  }

  /**
   * Adjust particle count based on performance
   */
  adjustParticleCount(currentCount: number, performanceRatio: number): number {
    if (!this.particleConfig.adaptiveScaling) {
      return currentCount;
    }

    // Performance ratio: 1.0 = target performance, < 1.0 = underperforming
    let targetCount = currentCount;

    if (performanceRatio < 0.8) {
      // Significant performance issues - reduce particles
      targetCount = Math.floor(currentCount * 0.75);
    } else if (performanceRatio < 0.9) {
      // Minor performance issues - slight reduction
      targetCount = Math.floor(currentCount * 0.9);
    } else if (performanceRatio > 1.1 && currentCount < this.getOptimalParticleCount()) {
      // Good performance - can increase particles
      targetCount = Math.floor(currentCount * 1.1);
    }

    // Clamp to limits
    return Math.max(
      this.particleConfig.minCount,
      Math.min(this.particleConfig.maxCount, targetCount)
    );
  }

  /**
   * Get rendering settings for device tier
   */
  getRenderingSettings(tier?: 'low' | 'medium' | 'high'): {
    pixelRatio: number;
    antialiasing: boolean;
    shadowMap: boolean;
    postProcessing: boolean;
  } {
    const deviceTier = tier || this.deviceCapabilities?.tier || 'medium';
    
    switch (deviceTier) {
      case 'low':
        return {
          pixelRatio: 1,
          antialiasing: false,
          shadowMap: false,
          postProcessing: false
        };
      case 'medium':
        return {
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          antialiasing: true,
          shadowMap: false,
          postProcessing: true
        };
      case 'high':
        return {
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          antialiasing: true,
          shadowMap: true,
          postProcessing: true
        };
      default:
        return this.getRenderingSettings('medium');
    }
  }

  /**
   * Update particle configuration
   */
  updateParticleConfig(config: Partial<ParticleConfig>): void {
    this.particleConfig = { ...this.particleConfig, ...config };
  }

  /**
   * Get current particle configuration
   */
  getParticleConfig(): ParticleConfig {
    return { ...this.particleConfig };
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.deviceCapabilities = null;
    this.particleConfig = {
      baseCount: 32768,
      maxCount: 65536,
      minCount: 4096,
      adaptiveScaling: true,
      qualityTiers: {
        low: 8192,
        medium: 16384,
        high: 32768
      }
    };
  }

  /**
   * Estimate device performance tier
   */
  private estimateDeviceTier(gl: WebGLRenderingContext, extensions: string[]): 'low' | 'medium' | 'high' {
    let score = 0;

    // Check for performance-indicating extensions
    const performanceExtensions = [
      'OES_vertex_array_object',
      'WEBGL_draw_buffers',
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_color_buffer_float'
    ];

    score += extensions.filter(ext => performanceExtensions.includes(ext)).length;

    // Check renderer string for GPU info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      
      // High-end GPU indicators
      if (renderer.match(/nvidia|geforce gtx|geforce rtx|quadro|tesla/i)) score += 3;
      else if (renderer.match(/amd|radeon rx|radeon pro/i)) score += 2;
      else if (renderer.match(/intel/i) && renderer.match(/iris|xe/i)) score += 1;
    }

    // Check maximum texture size (indicator of GPU capability)
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTextureSize >= 16384) score += 2;
    else if (maxTextureSize >= 8192) score += 1;

    // Check device memory (if available)
    // @ts-ignore - performance.memory is available in Chrome
    if (typeof window !== 'undefined' && window.performance?.memory) {
      // @ts-ignore
      const totalMemory = window.performance.memory.jsHeapSizeLimit / 1024 / 1024;
      if (totalMemory > 512) score += 2;
      else if (totalMemory > 256) score += 1;
    }

    // Check device pixel ratio (mobile devices typically have higher DPR)
    if (window.devicePixelRatio <= 1) score += 1; // Desktop typically performs better
    
    // Determine tier based on score
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Get optimal pixel ratio for device tier
   */
  private getOptimalPixelRatio(tier: 'low' | 'medium' | 'high'): number {
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    switch (tier) {
      case 'low':
        return 1;
      case 'medium':
        return Math.min(devicePixelRatio, 1.5);
      case 'high':
        return Math.min(devicePixelRatio, 2);
      default:
        return 1;
    }
  }

  /**
   * Get memory limit for device tier
   */
  private getMemoryLimit(tier: 'low' | 'medium' | 'high'): number {
    switch (tier) {
      case 'low':
        return 256; // 256 MB
      case 'medium':
        return 512; // 512 MB
      case 'high':
        return 1024; // 1 GB
      default:
        return 512;
    }
  }
}

/**
 * Convenience functions
 */
export function getPerformanceConfig(): PerformanceConfig {
  return PerformanceConfig.getInstance();
}

export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  return getPerformanceConfig().detectCapabilities();
}

export function getOptimalParticleCount(): number {
  return getPerformanceConfig().getOptimalParticleCount();
}