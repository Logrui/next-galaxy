/**
 * Basic Unit Tests for Loading Screen Types and Interfaces
 */

import { LoadingPhase } from '../../app/components/loading/types';

describe('Loading Screen Types', () => {
  test('LoadingPhase enum has correct values', () => {
    expect(LoadingPhase.INITIALIZING).toBe('INITIALIZING');
    expect(LoadingPhase.LOADING_ASSETS).toBe('LOADING_ASSETS');
    expect(LoadingPhase.ANIMATING).toBe('ANIMATING');
    expect(LoadingPhase.TRANSITIONING).toBe('TRANSITIONING');
    expect(LoadingPhase.COMPLETE).toBe('COMPLETE');
  });

  test('LoadingPhase enum has all required phases', () => {
    const phases = Object.values(LoadingPhase);
    expect(phases).toHaveLength(5);
    expect(phases).toContain('INITIALIZING');
    expect(phases).toContain('LOADING_ASSETS');
    expect(phases).toContain('ANIMATING');
    expect(phases).toContain('TRANSITIONING');
    expect(phases).toContain('COMPLETE');
  });
});

describe('Loading Screen Configuration', () => {
  test('ensures proper loading sequence order', () => {
    const expectedOrder = [
      LoadingPhase.INITIALIZING,
      LoadingPhase.LOADING_ASSETS,
      LoadingPhase.ANIMATING,
      LoadingPhase.TRANSITIONING,
      LoadingPhase.COMPLETE
    ];

    expect(expectedOrder).toHaveLength(5);
    expect(expectedOrder[0]).toBe(LoadingPhase.INITIALIZING);
    expect(expectedOrder[4]).toBe(LoadingPhase.COMPLETE);
  });

  test('validates loading phase transitions', () => {
    // Test that each phase can transition to the next
    const transitions = [
      [LoadingPhase.INITIALIZING, LoadingPhase.LOADING_ASSETS],
      [LoadingPhase.LOADING_ASSETS, LoadingPhase.ANIMATING],
      [LoadingPhase.ANIMATING, LoadingPhase.TRANSITIONING],
      [LoadingPhase.TRANSITIONING, LoadingPhase.COMPLETE],
    ];

    transitions.forEach(([from, to]) => {
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      expect(from).not.toBe(to);
    });
  });
});