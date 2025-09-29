/**
 * ShimmerRing Component - GSAP-powered Loading Ring
 * 
 * A glassmorphism-styled loading ring with shimmer effects and particle integration.
 * Follows dark glassmorphism design system with GSAP animations.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// Safe timeline creation for tests (when gsap may be partially mocked)
function safeTimeline(opts?: any) {
  try {
    if ((gsap as any)?.timeline) return (gsap as any).timeline(opts);
  } catch (_) {}
  const noop = () => stub;
  const stub: any = {
    to: noop,
    from: noop,
    fromTo: noop,
    set: noop,
    clear: () => {},
    play: () => {},
    kill: () => {},
  };
  return stub;
}
import { LoadingPhase } from './types';

export interface ShimmerRingProps {
  size?: number; // Diameter in pixels
  strokeWidth?: number;
  phase: LoadingPhase;
  progress: number; // 0-1
  onAnimationComplete?: () => void;
}

export default function ShimmerRing({ 
  size = 120, 
  strokeWidth = 3,
  phase,
  progress,
  onAnimationComplete 
}: ShimmerRingProps) {
  const ringRef = useRef<SVGCircleElement>(null);
  const shimmerRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    if (!ringRef.current || !shimmerRef.current || !containerRef.current) return;

    // Initialize GSAP timeline
    timelineRef.current = safeTimeline({
      paused: true,
      onComplete: onAnimationComplete
    });

    // Setup initial states (guard if gsap.set missing in tests)
    const safeSet = (gsap as any)?.set ? (gsap as any).set : (_t: any, _v: any) => {};
    safeSet(ringRef.current, {
      strokeDasharray: circumference,
      strokeDashoffset: circumference,
    });

    safeSet(shimmerRef.current, {
      strokeDasharray: circumference * 0.25,
      strokeDashoffset: 0,
      rotation: 0,
      transformOrigin: `${center}px ${center}px`
    });

    safeSet(containerRef.current, {
      scale: 0.8,
      opacity: 0.7
    });

    return () => {
      timelineRef.current?.kill();
    };
  }, [size, circumference, center, onAnimationComplete]);

  useEffect(() => {
    if (!timelineRef.current) return;

    // Update animation based on phase
    if ((timelineRef.current as any).clear) {
      (timelineRef.current as any).clear();
    }

    switch (phase) {
      case LoadingPhase.INITIALIZING:
        // Fade in and scale up
        timelineRef.current
          .to(containerRef.current, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
          });
        break;

      case LoadingPhase.LOADING_ASSETS:
        // Continuous shimmer rotation
        timelineRef.current
          .to(shimmerRef.current, {
            rotation: 360,
            duration: 2,
            ease: "none",
            repeat: -1
          });
        break;

      case LoadingPhase.ANIMATING:
        // Progress ring animation
        timelineRef.current
          .to(ringRef.current, {
            strokeDashoffset: circumference * (1 - progress),
            duration: 0.3,
            ease: "power2.out"
          });
        break;

      case LoadingPhase.TRANSITIONING:
        // Pulse and glow effect
        timelineRef.current
          .to(containerRef.current, {
            scale: 1.1,
            duration: 0.2,
            ease: "power2.out"
          })
          .to(containerRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.3)"
          });
        break;

      case LoadingPhase.COMPLETE:
        // Complete animation and fade out
        timelineRef.current
          .to(ringRef.current, {
            strokeDashoffset: 0,
            duration: 0.5,
            ease: "power2.out"
          })
          .to(containerRef.current, {
            scale: 1.2,
            opacity: 0,
            duration: 0.4,
            ease: "power2.in"
          }, "-=0.2");
        break;
    }

    timelineRef.current.play();
  }, [phase, progress, circumference]);

  return (
    <div
      ref={containerRef}
      data-testid="shimmer-ring"
      className="relative flex items-center justify-center backdrop-blur-md bg-white/10"
      style={{ 
        width: size, 
        height: size,
        filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Loading progress: ${Math.round(progress * 100)} percent`}
    >
      {/* Glass container with backdrop blur */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'var(--glass-primary)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-glass)'
        }}
      />
      
      {/* SVG Ring Container */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
        style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' }}
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-glass)"
          strokeWidth={strokeWidth / 2}
          opacity={0.3}
        />
        
        {/* Progress ring */}
        <circle
          ref={ringRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            filter: 'drop-shadow(0 0 6px var(--accent-blue))'
          }}
        />
        
        {/* Shimmer effect */}
        <circle
          ref={shimmerRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth={strokeWidth + 1}
          strokeLinecap="round"
          opacity={0.6}
          style={{
            filter: 'drop-shadow(0 0 12px var(--accent-cyan))'
          }}
        />
      </svg>
      
      {/* Center indicator */}
      <div
        className="relative z-10 flex flex-col items-center justify-center rounded-full"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          background: 'var(--glass-secondary)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-accent)'
        }}
      >
        {phase === LoadingPhase.LOADING_ASSETS || phase === LoadingPhase.COMPLETE ? (
          <span className="text-xs font-mono text-white/80">
            {phase === LoadingPhase.COMPLETE ? 100 : Math.round(progress * 100)}%
          </span>
        ) : (
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              background: 'var(--accent-blue)',
              boxShadow: '0 0 8px var(--accent-blue)'
            }}
          />
        )}
      </div>
    </div>
  );
}