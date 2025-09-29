import React from 'react';
import { render } from '@testing-library/react';
import GalaxyCanvas from '../../app/galaxy/GalaxyCanvas';
import LoadingScreen from '../../app/components/loading/LoadingScreen';

// Minimal smoke test ensuring both components can mount sequentially without WebGL context collision.
// NOTE: Real WebGL context sharing to be validated once integration code (T030) implemented.

describe('WebGL Context Sharing (Placeholder)', () => {
  it('mounts LoadingScreen then GalaxyCanvas without crashing', () => {
    // Loading screen unmount simulation
    const { unmount } = render(<LoadingScreen audioPreference="silent" />);
    unmount();
    render(<GalaxyCanvas />);
  });
});
