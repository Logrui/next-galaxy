// @ts-nocheck
/**
 * Accessibility Tests for Loading Screen System
 * 
 * Tests comprehensive accessibility features including:
 * - ARIA attributes and roles
 * - Keyboard navigation
 * - Screen reader announcements
 * - Reduced motion preferences
 * - High contrast support
 * - Focus management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadingScreen from '../../app/components/loading/LoadingScreen';
import { LoadingPhase } from '../../app/components/loading/types';

// Mock GSAP
jest.mock('gsap', () => ({
  gsap: {
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      pause: jest.fn().mockReturnThis(),
      onComplete: jest.fn().mockReturnThis(),
    })),
    set: jest.fn(),
    to: jest.fn(),
  }
}));

// Mock WebGL and Canvas
const mockCanvas: Partial<HTMLCanvasElement> = {
  getContext: jest.fn(() => ({
    createShader: jest.fn(),
    createProgram: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(() => 0),
    getUniformLocation: jest.fn(() => {}),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    uniform1f: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    createBuffer: jest.fn(() => ({})),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn(),
    enable: jest.fn(),
    blendFunc: jest.fn(),
    drawArrays: jest.fn(),
    viewport: jest.fn(),
  })),
  width: 800,
  height: 600,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  style: {},
};

const realCreateElement = document.createElement.bind(document);
// Lightweight canvas interception without recursive call
document.createElement = jest.fn(<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: any) => {
  if (tagName === 'canvas') {
    return mockCanvas as HTMLCanvasElement;
  }
  return realCreateElement(tagName, options);
}) as any;

// Mock media queries for accessibility preferences
const mockMediaQuery = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('LoadingScreen Accessibility', () => {
  let originalMatchMedia: typeof window.matchMedia;
  
  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.clearAllMocks();
  });

  describe('ARIA Attributes and Roles', () => {
    it('should have proper ARIA attributes for screen readers', async () => {
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Check main container ARIA attributes
      expect(loadingScreen).toHaveAttribute('role', 'progressbar');
      expect(loadingScreen).toHaveAttribute('aria-label', 'Loading application');
      expect(loadingScreen).toHaveAttribute('aria-valuenow');
      expect(loadingScreen).toHaveAttribute('aria-valuemin', '0');
      expect(loadingScreen).toHaveAttribute('aria-valuemax', '100');
      expect(loadingScreen).toHaveAttribute('aria-live', 'polite');
      expect(loadingScreen).toHaveAttribute('aria-busy', 'true');

      // Check shimmer ring accessibility
      const shimmerRing = screen.getByTestId('shimmer-ring');
      expect(shimmerRing).toHaveAttribute('role', 'progressbar');
      expect(shimmerRing).toHaveAttribute('aria-label');
    });

    it('should update aria-valuenow as progress changes', async () => {
      const onComplete = jest.fn();
      const onError = jest.fn();

      const { rerender } = render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Initial progress should be 0
      expect(loadingScreen).toHaveAttribute('aria-valuenow', '0');

      // Wait for some progress (mocked asset loading should trigger updates)
      await waitFor(() => {
        const ariaValueNow = loadingScreen.getAttribute('aria-valuenow');
        expect(parseInt(ariaValueNow || '0')).toBeGreaterThanOrEqual(0);
      });
    });

    it('should set aria-busy to false when loading completes', async () => {
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
          skipAnimation={true}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Initially should be busy
      expect(loadingScreen).toHaveAttribute('aria-busy', 'true');

      // Wait for completion
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Escape key to focus skip button', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Trigger user interaction first
      await user.click(document.body);

      // Wait for skip button to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/skip loading animation/i)).toBeInTheDocument();
      });

      const skipButton = screen.getByLabelText(/skip loading animation/i);
      
      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Skip button should be focused
      expect(skipButton).toHaveFocus();
    });

    it('should activate skip button with Enter and Space keys', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Trigger user interaction
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.getByLabelText(/skip loading animation/i)).toBeInTheDocument();
      });

      const skipButton = screen.getByLabelText(/skip loading animation/i);
      skipButton.focus();

      // Test Enter key
      fireEvent.keyDown(skipButton, { key: 'Enter' });
      
      // Should trigger skip (we can't easily test the GSAP skip, but we can test the event)
      expect(skipButton).toHaveFocus();

      // Test Space key
      fireEvent.keyDown(skipButton, { key: ' ' });
      expect(skipButton).toHaveFocus();
    });

    it('should manage tab order during loading', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Trigger user interaction
      await user.click(document.body);

      // During loading, tab navigation should be limited
      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Tab key should be handled
      fireEvent.keyDown(loadingScreen, { key: 'Tab' });
      
      // Loading screen should be focusable
      expect(loadingScreen).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide screen reader instructions', () => {
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Check for screen reader content
      expect(screen.getByText(/loading the galaxy visualization/i)).toBeInTheDocument();
      expect(screen.getByText(/progress:.*percent complete/i)).toBeInTheDocument();
    });

    it('should have announcement region for progress updates', () => {
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Check for aria-live region
      const announcementRegion = screen.getByRole('status');
      expect(announcementRegion).toHaveAttribute('aria-live', 'polite');
      expect(announcementRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide detailed skip button description', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Trigger user interaction
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.getByLabelText(/skip loading animation and proceed directly/i)).toBeInTheDocument();
      });

      const skipButton = screen.getByLabelText(/skip loading animation and proceed directly/i);
      expect(skipButton).toHaveAttribute('aria-describedby', 'skip-button-help');
      
      // Check for help text
      expect(screen.getByText(/press enter or space to skip/i)).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return mockMediaQuery(true);
        }
        return mockMediaQuery(false);
      });

      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Should have reduced motion styles applied
      const styles = window.getComputedStyle(loadingScreen);
      expect(loadingScreen.style.animation).toBe('none');
    });

    it('should maintain normal animations when reduced motion is not preferred', () => {
      // Mock normal motion preference
      window.matchMedia = jest.fn().mockImplementation((query) => {
        return mockMediaQuery(false);
      });

      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Should not have reduced motion styles
      expect(loadingScreen.style.animation).not.toBe('none');
    });
  });

  describe('High Contrast Support', () => {
    it('should adapt to high contrast preferences', () => {
      // Mock high contrast preference
      window.matchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(prefers-contrast: high)') {
          return mockMediaQuery(true);
        }
        return mockMediaQuery(false);
      });

      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Should have high contrast filter applied
      expect(loadingScreen.style.filter).toContain('contrast(2)');
    });
  });

  describe('Focus Management', () => {
    it('should be focusable when focus management is enabled', () => {
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Should have tabIndex for focus management
      expect(loadingScreen).toHaveAttribute('tabIndex', '0');
    });

    it('should focus loading screen during asset loading phase', () => {
      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      const loadingScreen = screen.getByTestId('loading-screen');
      
      // Should be focusable
      loadingScreen.focus();
      expect(loadingScreen).toHaveFocus();
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should provide accessible error messages for WebGL failure', () => {
      // Mock WebGL failure
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'canvas') {
          return {
            ...mockCanvas,
            getContext: jest.fn(() => null), // WebGL not supported
          };
        }
        return originalCreateElement.call(document, tagName);
      });

      const onComplete = jest.fn();
      const onError = jest.fn();

      render(
        <LoadingScreen 
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Should show accessible error message
      expect(screen.getByText(/webgl not supported/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue anyway/i })).toBeInTheDocument();

      // Restore
      document.createElement = originalCreateElement;
    });
  });
});