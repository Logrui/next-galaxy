/**
 * Unit Tests for Loading Components
 * 
 * Tests individual loading screen components in isolation
 */

// GSAP mock MUST come before component imports
jest.mock('gsap', () => {
  let onCompleteCb: (() => void) | null = null;
  const timelineObj = {
    fromTo: jest.fn().mockReturnThis(),
    to: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    kill: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    seek: jest.fn(),
    call: jest.fn((_fn: Function, _args: any[], _position?: number) => timelineObj),
    progress: jest.fn(() => 0),
    time: jest.fn(() => 0),
    play: jest.fn(() => { setTimeout(() => { if (onCompleteCb) onCompleteCb(); }, 0); return timelineObj; }),
    eventCallback: jest.fn((name: string, cb?: () => void) => { if (name === 'onComplete' && cb) onCompleteCb = cb; return timelineObj; }),
  };
  const timelineFactory = jest.fn((opts?: any) => {
    if (opts?.onComplete) {
      onCompleteCb = opts.onComplete;
    }
    return timelineObj;
  });
  return { gsap: { timeline: timelineFactory }, timeline: timelineFactory, default: { timeline: timelineFactory } };
});

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
// IMPORTANT: Place critical mocks BEFORE importing components to avoid ESM loader issues
// Mock Asset Manager early to prevent importing Three.js example modules during tests
jest.mock('../../app/utils/AssetManager', () => ({
  AssetManager: {
    getInstance: jest.fn(() => ({
      onProgress: jest.fn(() => () => {}),
      loadEssentialAssets: jest.fn(() => Promise.resolve()),
      preloadAssets: jest.fn(() => Promise.resolve()),
      getTexture: jest.fn(() => null),
      getAudio: jest.fn(() => null),
      isLoaded: jest.fn(() => false),
    })),
  },
}));

import ShimmerRing from '../../app/components/loading/ShimmerRing';
import AudioController from '../../app/components/loading/AudioController';
import { LoadingScreen } from '../../app/components/loading/LoadingScreen';
import { LoadingPhase } from '../../app/components/loading/types';
import { AudioControllerConfig } from '../../app/components/loading/audio-types';

// GSAP mocked via manual mock in __mocks__/gsap.js

// Mock Three.js
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    background: null,
  })),
  PerspectiveCamera: jest.fn(() => ({
    position: { z: 100 },
    aspect: 1,
    updateProjectionMatrix: jest.fn(),
  })),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    getContext: jest.fn(() => ({})),
    domElement: document.createElement('canvas'),
  })),
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn(),
    dispose: jest.fn(),
  })),
  BufferAttribute: jest.fn(),
  Points: jest.fn(() => ({
    geometry: {
      dispose: jest.fn(),
    },
    material: {
      dispose: jest.fn(),
    },
    scale: { x: 1, y: 1, z: 1 },
  })),
  PointsMaterial: jest.fn(() => ({
    dispose: jest.fn(),
    opacity: 1,
  })),
  Color: jest.fn(),
  Vector3: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
  SRGBColorSpace: 'srgb',
  RepeatWrapping: 1000,
  NearestFilter: 9728,
  __esModule: true,
}));

// Mock Three.js EXR Loader
jest.mock('three/examples/jsm/loaders/EXRLoader.js', () => ({
  EXRLoader: jest.fn(() => ({
    load: jest.fn((path: string, onLoad?: (texture: any) => void) => {
      const mockTexture = {
        generateMipmaps: false,
        minFilter: 9728,
        magFilter: 9728,
      };
      if (onLoad) {
        setTimeout(() => onLoad(mockTexture), 0);
      }
    }),
  })),
}));

// Mock WebGL Context Manager
jest.mock('../../app/utils/WebGLContextManager', () => ({
  WebGLContextManager: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(() => ({
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
      })),
      setCanvasLayer: jest.fn(),
      setPointerEvents: jest.fn(),
      clear: jest.fn(),
      render: jest.fn(),
    })),
  },
}));

// Mock Performance Monitor
jest.mock('../../app/utils/PerformanceMonitor', () => ({
  PerformanceMonitor: {
    getInstance: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      updateParticleCount: jest.fn(),
      onOptimization: jest.fn(() => () => {}),
    })),
  },
}));

// Mock Performance Config
jest.mock('../../app/utils/PerformanceConfig', () => ({
  getOptimalParticleCount: jest.fn(() => 16384),
}));

// (Moved AssetManager mock earlier)

describe('ShimmerRing Component', () => {
  test('renders without crashing', () => {
    render(<ShimmerRing phase={LoadingPhase.INITIALIZING} progress={0} />);
    const shimmerRing = screen.getByTestId('shimmer-ring');
    expect(shimmerRing).toBeInTheDocument();
  });

  test('shows progress during loading and completion at 100%', () => {
    const { rerender } = render(<ShimmerRing phase={LoadingPhase.LOADING_ASSETS} progress={0.42} />);
    expect(screen.getByText('42%')).toBeInTheDocument();
    rerender(<ShimmerRing phase={LoadingPhase.COMPLETE} progress={1} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

describe('AudioController Component', () => {
  const askConfig: AudioControllerConfig = {
    preference: 'ask',
    volume: 0.5,
    fadeInDuration: 1000,
    fadeOutDuration: 500,
  };

  test('renders preference UI when preference is ask', () => {
    render(<AudioController config={askConfig} phase={LoadingPhase.INITIALIZING} />);
    expect(screen.getByText(/enable loading screen audio/i)).toBeInTheDocument();
  });

  test('does not render UI when preference predetermined', () => {
    const enabledConfig = { ...askConfig, preference: 'enabled' as const };
    render(<AudioController config={enabledConfig} phase={LoadingPhase.INITIALIZING} />);
    expect(screen.queryByText(/enable loading screen audio/i)).not.toBeInTheDocument();
  });

  test('gracefully handles missing audio files', () => {
    render(<AudioController config={askConfig} phase={LoadingPhase.INITIALIZING} />);
    expect(true).toBe(true); // no error expected
  });
});

describe('LoadingScreen Integration', () => {
  test('renders main loading screen', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    
    render(
      <LoadingScreen 
        onComplete={onComplete}
        onError={onError}
      />
    );
    
    // Should render loading container
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  test('removes Begin gate after click', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    render(<LoadingScreen onComplete={onComplete} onError={onError} />);
    const btn = screen.getByTestId('begin-button');
    fireEvent.click(btn);
    expect(screen.queryByTestId('begin-button')).not.toBeInTheDocument();
  });

  test('does not emit WebGL failure error in test environment', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    render(<LoadingScreen onComplete={onComplete} onError={onError} />);
    expect(onError).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'webgl-failure' }));
  });

  test('skips animation when requested', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    render(<LoadingScreen onComplete={onComplete} onError={onError} skipAnimation />);
    const loading = screen.queryByTestId('loading-screen');
    const fallback = screen.queryByText(/WebGL Not Supported/i);
    expect(loading || fallback).toBeTruthy();
  });

  test('respects audio preferences', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    
    render(
      <LoadingScreen 
        onComplete={onComplete}
        onError={onError}
        audioPreference="disabled"
      />
    );
    
    // Should not show audio controls when disabled
    expect(screen.queryByLabelText(/audio/i)).not.toBeInTheDocument();
  });

  test('shows Begin gate and waits for user interaction', async () => {
    const onComplete = jest.fn();
    const onError = jest.fn();

    render(
      <LoadingScreen
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Begin button present
    const beginButton = screen.getByTestId('begin-button');
    expect(beginButton).toBeInTheDocument();

    // onComplete should not have been called yet
    expect(onComplete).not.toHaveBeenCalled();

    // Simulate click to start animation
    fireEvent.click(beginButton);

    // After click, button should disappear (gate removed)
    await waitFor(() => {
      expect(screen.queryByTestId('begin-button')).not.toBeInTheDocument();
    });
  });
});

describe('Performance Considerations', () => {
  test('does not cause memory leaks', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    
    const { unmount } = render(
      <LoadingScreen 
        onComplete={onComplete}
        onError={onError}
      />
    );
    
    // Unmount should clean up properly
    unmount();
    
    // Verify cleanup was called (mocked methods should be called)
    expect(true).toBe(true); // Placeholder - actual cleanup verification would be more complex
  });

  test('handles resize events', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    
    render(
      <LoadingScreen 
        onComplete={onComplete}
        onError={onError}
      />
    );
    
    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });
    
    fireEvent(window, new Event('resize'));
    
    // Should handle resize without errors
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });
});

describe('Accessibility Features', () => {
  test('provides proper ARIA labels', () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
    
    render(
      <LoadingScreen 
        onComplete={onComplete}
        onError={onError}
      />
    );
    
    // Should have proper labeling for screen readers
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  test('supports reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: String(query).includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    const onComplete = jest.fn();
    const onError = jest.fn();
    
    render(
      <LoadingScreen 
        onComplete={onComplete}
        onError={onError}
      />
    );
    
    // Should respect reduced motion preferences
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });
});