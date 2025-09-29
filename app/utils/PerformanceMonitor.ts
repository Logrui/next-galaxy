/**
 * Performance Monitor - Real-time Performance Tracking and Optimization
 * 
 * Monitors FPS, memory usage, particle counts, and provides automatic
 * performance adjustments to maintain 60fps target.
 */

export interface PerformanceMetrics {
  fps: number;
  averageFps: number;
  memoryUsage: number; // MB
  particleCount: number;
  renderTime: number; // ms
  frameDrops: number;
  timestamp: number;
}

export interface PerformanceConfig {
  targetFps: number;
  maxParticles: number;
  minParticles: number;
  adaptiveQuality: boolean;
  memoryThreshold: number; // MB
  measureInterval: number; // ms
}

export interface PerformanceOptimization {
  particleReduction: number; // percentage
  qualityLevel: 'high' | 'medium' | 'low';
  antialiasing: boolean;
  pixelRatio: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private frameCount = 0;
  private lastFrameTime = 0;
  private measurementStartTime = 0;
  private isMonitoring = false;
  private animationId: number | null = null;
  private subscribers: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private optimizationCallbacks: Set<(optimization: PerformanceOptimization) => void> = new Set();

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetFps: 60,
      maxParticles: 32768,
      minParticles: 8192,
      adaptiveQuality: true,
      memoryThreshold: 512, // 512 MB
      measureInterval: 1000, // 1 second
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.measurementStartTime = performance.now();
    this.lastFrameTime = this.measurementStartTime;
    this.frameCount = 0;
    
    this.measureLoop();
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Subscribe to performance metrics updates
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Subscribe to optimization suggestions
   */
  onOptimization(callback: (optimization: PerformanceOptimization) => void): () => void {
    this.optimizationCallbacks.add(callback);
    return () => this.optimizationCallbacks.delete(callback);
  }

  /**
   * Update current particle count
   */
  updateParticleCount(count: number): void {
    // Clamp to configured limits
    const clampedCount = Math.max(
      this.config.minParticles,
      Math.min(this.config.maxParticles, count)
    );
    
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].particleCount = clampedCount;
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get historical metrics
   */
  getHistory(duration: number = 10000): PerformanceMetrics[] {
    const cutoffTime = performance.now() - duration;
    return this.metrics.filter(metric => metric.timestamp > cutoffTime);
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    averageFps: number;
    minFps: number;
    maxFps: number;
    frameDropPercentage: number;
    memoryTrend: 'stable' | 'increasing' | 'decreasing';
  } {
    if (this.metrics.length < 2) {
      return {
        averageFps: 0,
        minFps: 0,
        maxFps: 0,
        frameDropPercentage: 0,
        memoryTrend: 'stable'
      };
    }

    const recentMetrics = this.getHistory(5000); // Last 5 seconds
    const fps = recentMetrics.map(m => m.fps);
    const totalFrameDrops = recentMetrics.reduce((sum, m) => sum + m.frameDrops, 0);
    const totalFrames = recentMetrics.length * this.config.targetFps;

    // Memory trend analysis
    const memoryValues = recentMetrics.map(m => m.memoryUsage);
    const memorySlope = this.calculateTrend(memoryValues);
    let memoryTrend: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (memorySlope > 0.1) memoryTrend = 'increasing';
    else if (memorySlope < -0.1) memoryTrend = 'decreasing';

    return {
      averageFps: fps.reduce((sum, f) => sum + f, 0) / fps.length,
      minFps: Math.min(...fps),
      maxFps: Math.max(...fps),
      frameDropPercentage: (totalFrameDrops / totalFrames) * 100,
      memoryTrend
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Performance measurement loop
   */
  private measureLoop = (): void => {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    
    this.frameCount++;

    // Measure every interval
    if (now - this.measurementStartTime >= this.config.measureInterval) {
      const fps = (this.frameCount * 1000) / (now - this.measurementStartTime);
      const averageFps = this.calculateAverageFps();
      const memoryUsage = this.getMemoryUsage();
      const frameDrops = this.calculateFrameDrops(fps);
      
      const metrics: PerformanceMetrics = {
        fps: Math.round(fps * 100) / 100,
        averageFps: Math.round(averageFps * 100) / 100,
        memoryUsage,
        particleCount: this.getCurrentParticleCount(),
        renderTime: deltaTime,
        frameDrops,
        timestamp: now
      };

      this.metrics.push(metrics);
      
      // Keep only recent metrics (last 30 seconds)
      const cutoff = now - 30000;
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
      
      // Notify subscribers
      this.subscribers.forEach(callback => callback(metrics));
      
      // Check for optimization needs
      if (this.config.adaptiveQuality) {
        this.checkOptimization(metrics);
      }
      
      // Reset counters
      this.frameCount = 0;
      this.measurementStartTime = now;
    }
    
    this.lastFrameTime = now;
    this.animationId = requestAnimationFrame(this.measureLoop);
  };

  /**
   * Calculate average FPS over recent history
   */
  private calculateAverageFps(): number {
    if (this.metrics.length === 0) return 0;
    
    const recentMetrics = this.getHistory(5000); // Last 5 seconds
    if (recentMetrics.length === 0) return 0;
    
    return recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    // @ts-ignore - performance.memory is available in Chrome
    if (typeof window !== 'undefined' && window.performance?.memory) {
      // @ts-ignore
      return Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Get current particle count from last metrics
   */
  private getCurrentParticleCount(): number {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].particleCount : 0;
  }

  /**
   * Calculate frame drops
   */
  private calculateFrameDrops(currentFps: number): number {
    const expectedFrames = this.config.measureInterval / (1000 / this.config.targetFps);
    const actualFrames = this.frameCount;
    return Math.max(0, expectedFrames - actualFrames);
  }

  /**
   * Check if optimizations are needed
   */
  private checkOptimization(metrics: PerformanceMetrics): void {
    const stats = this.getStats();
    let optimizationNeeded = false;
    
    const optimization: PerformanceOptimization = {
      particleReduction: 0,
      qualityLevel: 'high',
      antialiasing: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2)
    };

    // Check FPS performance
    if (stats.averageFps < this.config.targetFps * 0.8) { // 80% of target
      optimizationNeeded = true;
      
      if (stats.averageFps < this.config.targetFps * 0.6) { // 60% of target
        optimization.qualityLevel = 'low';
        optimization.particleReduction = 50;
        optimization.antialiasing = false;
        optimization.pixelRatio = 1;
      } else {
        optimization.qualityLevel = 'medium';
        optimization.particleReduction = 25;
        optimization.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      }
    }

    // Check memory usage
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      optimizationNeeded = true;
      optimization.particleReduction = Math.max(optimization.particleReduction, 30);
    }

    // Check frame drops
    if (stats.frameDropPercentage > 10) { // More than 10% frame drops
      optimizationNeeded = true;
      optimization.particleReduction = Math.max(optimization.particleReduction, 20);
    }

    if (optimizationNeeded) {
      this.optimizationCallbacks.forEach(callback => callback(optimization));
    }
  }

  /**
   * Calculate trend (slope) for a series of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Dispose of the performance monitor
   */
  dispose(): void {
    this.stop();
    this.subscribers.clear();
    this.optimizationCallbacks.clear();
    this.metrics = [];
    PerformanceMonitor.instance = null;
  }
}