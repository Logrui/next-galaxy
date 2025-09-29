/**
 * ParticleExplosion Component - Three.js Particle Animation
 * 
 * Creates a 3D particle explosion effect that transitions into the main galaxy view.
 * Maintains 32,768 particle count consistency with the main galaxy system.
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { LoadingPhase, ParticleSystemState } from './types';
import { WebGLContextManager } from '../../utils/WebGLContextManager';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';
import { getOptimalParticleCount } from '../../utils/PerformanceConfig';

export interface ParticleExplosionProps {
  phase: LoadingPhase;
  progress: number; // 0-1
  onComplete?: (particleSystem: ParticleSystemState) => void;
  onError?: (error: string) => void;
}

export default function ParticleExplosion({ 
  phase, 
  progress, 
  onComplete, 
  onError 
}: ParticleExplosionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  // Get optimal particle count for device
  const optimalParticleCount = getOptimalParticleCount();
  
  // Particle state for handoff to galaxy system
  const particleStateRef = useRef<ParticleSystemState>({
    particleCount: optimalParticleCount,
    positions: new Float32Array(optimalParticleCount * 3),
    colors: new Float32Array(optimalParticleCount * 3),
    velocities: new Float32Array(optimalParticleCount * 3),
    phase: LoadingPhase.INITIALIZING
  });

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!containerRef.current) return false;

    try {
      // Get shared WebGL context manager
      const contextManager = WebGLContextManager.getInstance();
      
      // Initialize shared renderer with the container element
      const renderer = contextManager.initialize(containerRef.current, {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      rendererRef.current = renderer;
      
      // Configure canvas for loading screen layer
      contextManager.setCanvasLayer(100); // Above background, below UI
      contextManager.setPointerEvents(false); // No interaction during loading

      // Scene
      const scene = new THREE.Scene();
      scene.background = null; // Transparent background
      sceneRef.current = scene;

      // Camera - use container dimensions
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 100;
      cameraRef.current = camera;

      // Create particle system
      createParticleSystem();

      return true;
    } catch (error) {
      onError?.(`WebGL initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [onError]);

  const createParticleSystem = useCallback(() => {
    if (!sceneRef.current) return;

    const particleCount = optimalParticleCount;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Define color palette (matching galaxy system)
    const colorPalette = [
      new THREE.Color(0x0891b2), // cyan
      new THREE.Color(0x3b82f6), // blue
      new THREE.Color(0xec4899)  // magenta
    ];

    // Initialize particles in explosion formation
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Initial position (center point for explosion)
      positions[i3] = (Math.random() - 0.5) * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * 2;

      // Velocity (explosion direction)
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      
      velocities[i3] = Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta);
      velocities[i3 + 2] = Math.cos(phi);

      // Color (cycle through palette)
      const color = colorPalette[i % colorPalette.length];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    // Store in state for handoff
    particleStateRef.current.positions = positions;
    particleStateRef.current.colors = colors;
    particleStateRef.current.velocities = velocities;

    // Create Three.js geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle material with glassmorphism style
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    // Create particle system
    const particles = new THREE.Points(geometry, material);
    sceneRef.current.add(particles);
    particleSystemRef.current = particles;

    // Store WebGL resources for handoff
    particleStateRef.current.webglResources = {
      bufferGeometry: geometry,
      material: material,
      renderingMethod: 'standard',
      memoryUsage: (positions.length + colors.length) * 4 // bytes
    };
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const contextManager = WebGLContextManager.getInstance();
    contextManager.clear(); // Clear before rendering
    contextManager.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Handle phase animations
  useEffect(() => {
    if (!particleSystemRef.current) return;

    timelineRef.current?.kill();
    timelineRef.current = gsap.timeline();

    const positions = particleSystemRef.current.geometry.attributes.position;
    const material = particleSystemRef.current.material as THREE.PointsMaterial;

    switch (phase) {
      case LoadingPhase.INITIALIZING:
        // Fade in particles
        timelineRef.current.fromTo(material, {
          opacity: 0
        }, {
          opacity: 0.8,
          duration: 1,
          ease: 'power2.out'
        });
        break;

      case LoadingPhase.ANIMATING:
        // Explosion animation
        timelineRef.current
          .to(particleSystemRef.current.scale, {
            x: progress * 5 + 1,
            y: progress * 5 + 1, 
            z: progress * 5 + 1,
            duration: 0.5,
            ease: 'power2.out'
          })
          .to(particleSystemRef.current.rotation, {
            y: progress * Math.PI * 2,
            duration: 0.8,
            ease: 'none'
          }, 0);
        break;

      case LoadingPhase.TRANSITIONING:
        // Transition to galaxy formation
        particleStateRef.current.phase = LoadingPhase.TRANSITIONING;
        
        timelineRef.current
          .to(material, {
            size: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
          })
          .to(cameraRef.current!.position, {
            z: 200,
            duration: 1,
            ease: 'power2.inOut'
          }, 0);
        break;

      case LoadingPhase.COMPLETE:
        // Complete state - prepare for handoff
        particleStateRef.current.phase = LoadingPhase.COMPLETE;
        
        timelineRef.current
          .to(material, {
            opacity: 1,
            duration: 0.3
          })
          .call(() => {
            // Handoff particle system to galaxy component
            onComplete?.(particleStateRef.current);
          });
        break;
    }
  }, [phase, progress, onComplete]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and cleanup
  useEffect(() => {
    const success = initializeScene();
    if (success) {
      // Start performance monitoring
      const perfMonitor = PerformanceMonitor.getInstance({
        targetFps: 60,
        maxParticles: optimalParticleCount,
        adaptiveQuality: true
      });
      
      perfMonitor.start();
      perfMonitor.updateParticleCount(optimalParticleCount);
      
      animate();
    }

    return () => {
      // Cleanup
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      timelineRef.current?.kill();
      
      // Stop performance monitoring
      const perfMonitor = PerformanceMonitor.getInstance();
      perfMonitor.stop();
      
      // Don't dispose shared renderer - it will be reused by galaxy system
      // The context manager handles renderer lifecycle
      
      if (particleSystemRef.current) {
        particleSystemRef.current.geometry.dispose();
        (particleSystemRef.current.material as THREE.Material).dispose();
      }
    };
  }, [initializeScene, animate, optimalParticleCount]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ 
        background: 'transparent',
        pointerEvents: 'none'
      }}
    />
  );
}