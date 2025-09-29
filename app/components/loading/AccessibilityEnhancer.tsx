/**
 * Accessibility Enhancement for Loading Screen
 * 
 * Provides comprehensive accessibility features including:
 * - Keyboard navigation support
 * - Screen reader announcements
 * - Reduced motion preferences
 * - High contrast mode
 * - Focus management
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { LoadingPhase } from '../loading/types';

export interface AccessibilityConfig {
  announcements: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  focusManagement: boolean;
}

export interface AccessibilityState {
  currentAnnouncement: string | null;
  reducedMotionPreferred: boolean;
  highContrastMode: boolean;
  lastFocusedElement: Element | null;
  screenReaderActive: boolean;
}

export function useAccessibility(phase: LoadingPhase, progress: number) {
  const [config, setConfig] = useState<AccessibilityConfig>({
    announcements: true,
    reducedMotion: false,
    highContrast: false,
    keyboardNavigation: true,
    focusManagement: true
  });

  const [state, setState] = useState<AccessibilityState>({
    currentAnnouncement: null,
    reducedMotionPreferred: false,
    highContrastMode: false,
    lastFocusedElement: null,
    screenReaderActive: false
  });

  const announcementRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  // Detect user preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)')
    };

    const updatePreferences = () => {
      setState(prev => ({
        ...prev,
        reducedMotionPreferred: mediaQueries.reducedMotion.matches,
        highContrastMode: mediaQueries.highContrast.matches
      }));

      setConfig(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches
      }));
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Detect screen reader usage
  useEffect(() => {
    let screenReaderDetected = false;

    // Check for common screen reader indicators
    const checkScreenReader = () => {
      // Check for NVDA, JAWS, or other screen readers
      const hasScreenReader = !!(
        (window as any).speechSynthesis ||
        (window as any).navigator?.userAgent?.includes('NVDA') ||
        (window as any).navigator?.userAgent?.includes('JAWS') ||
        document.querySelector('[aria-live]') ||
        document.querySelector('[role="region"]')
      );

      if (hasScreenReader !== screenReaderDetected) {
        screenReaderDetected = hasScreenReader;
        setState(prev => ({
          ...prev,
          screenReaderActive: hasScreenReader
        }));
      }
    };

    checkScreenReader();
    
    // Recheck periodically
    const interval = setInterval(checkScreenReader, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Phase announcements for screen readers
  useEffect(() => {
    if (!config.announcements) return;

    let announcement = '';
    
    switch (phase) {
      case LoadingPhase.INITIALIZING:
        announcement = 'Initializing application';
        break;
      case LoadingPhase.LOADING_ASSETS:
        announcement = `Loading assets, ${Math.round(progress * 100)} percent complete`;
        break;
      case LoadingPhase.ANIMATING:
        announcement = 'Preparing interactive experience';
        break;
      case LoadingPhase.TRANSITIONING:
        announcement = 'Almost ready, transitioning to main application';
        break;
      case LoadingPhase.COMPLETE:
        announcement = 'Loading complete, welcome to the galaxy';
        break;
      default:
        announcement = 'Loading in progress';
    }

    setState(prev => ({
      ...prev,
      currentAnnouncement: announcement
    }));

    // Clear announcement after delay
    const timeout = setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentAnnouncement: null
      }));
    }, 3000);

    return () => clearTimeout(timeout);
  }, [phase, progress, config.announcements]);

  // Keyboard navigation setup
  useEffect(() => {
    if (!config.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          // Focus skip button if available
          if (skipButtonRef.current) {
            skipButtonRef.current.focus();
            event.preventDefault();
          }
          break;
          
        case 'Tab':
          // Manage tab order during loading
          if (phase !== LoadingPhase.COMPLETE) {
            // Only allow tabbing to skip button during loading
            const tabbableElements = document.querySelectorAll(
              'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            
            if (tabbableElements.length <= 1) {
              event.preventDefault();
            }
          }
          break;
          
        case ' ':
        case 'Enter':
          // Activate skip button if focused
          if (document.activeElement === skipButtonRef.current) {
            event.preventDefault();
            skipButtonRef.current?.click();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config.keyboardNavigation, phase]);

  // Focus management
  useEffect(() => {
    if (!config.focusManagement) return;

    // Store the last focused element when loading starts
    if (phase === LoadingPhase.INITIALIZING && document.activeElement) {
      setState(prev => ({
        ...prev,
        lastFocusedElement: document.activeElement
      }));
    }

    // Focus the loading screen when it appears
    const loadingScreen = document.querySelector('[data-testid="loading-screen"]') as HTMLElement;
    if (loadingScreen && phase === LoadingPhase.LOADING_ASSETS) {
      loadingScreen.focus();
    }

    // Restore focus when loading completes
    if (phase === LoadingPhase.COMPLETE && state.lastFocusedElement) {
      const elementToFocus = state.lastFocusedElement as HTMLElement;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        elementToFocus.focus();
      }
    }
  }, [phase, config.focusManagement, state.lastFocusedElement]);

  return {
    config,
    state,
    setConfig,
    announcementRef,
    skipButtonRef,
    
    // Computed accessibility styles
    getAccessibilityStyles: () => ({
      animation: config.reducedMotion ? 'none' : undefined,
      transition: config.reducedMotion ? 'none' : undefined,
      filter: config.highContrast ? 'contrast(2) saturate(0.5)' : undefined,
    }),
    
    // Accessibility announcements component
    AnnouncementRegion: () => (
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {state.currentAnnouncement}
      </div>
    ),
    
    // Enhanced skip button with accessibility features
    AccessibleSkipButton: ({ onSkip, visible }: { onSkip: () => void; visible: boolean }) => (
      <button
        ref={skipButtonRef}
        onClick={onSkip}
        className={`
          mt-6 px-4 py-2 text-sm rounded-full transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          hover:scale-105 active:scale-95
          ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{
          background: 'var(--glass-primary)',
          color: 'var(--text-accent)',
          border: '1px solid var(--border-accent)',
          backdropFilter: 'blur(8px)',
          ...(!config.reducedMotion ? {} : { transform: 'none' })
        }}
        aria-label="Skip loading animation and proceed directly to application"
        aria-describedby="skip-button-help"
      >
        Skip Animation
        <span id="skip-button-help" className="sr-only">
          Press Enter or Space to skip the loading animation and go directly to the main application
        </span>
      </button>
    )
  };
}

// Screen reader only utility class
export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden' as const,
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: '0'
};

// High contrast mode utility
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

// Reduced motion utility
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}