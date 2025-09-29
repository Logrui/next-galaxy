import '@testing-library/jest-dom'

// Mock Three.js for tests since it requires WebGL context
jest.mock('three', () => {
  const actualThree = jest.requireActual('three')
  return {
    ...actualThree,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
      domElement: document.createElement('canvas'),
      getContext: jest.fn().mockReturnValue({
        getParameter: jest.fn(),
        getExtension: jest.fn(),
      }),
    })),
    Scene: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn(),
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      lookAt: jest.fn(),
    })),
    BufferGeometry: jest.fn().mockImplementation(() => ({
      setAttribute: jest.fn(),
      dispose: jest.fn(),
    })),
    Points: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      rotation: { set: jest.fn() },
      scale: { set: jest.fn() },
    })),
  }
})

// Mock GSAP for tests
jest.mock('gsap', () => ({
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    pause: jest.fn().mockReturnThis(),
    kill: jest.fn().mockReturnThis(),
  })),
  to: jest.fn(),
  from: jest.fn(),
  set: jest.fn(),
}))

// Mock window.requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn((cb) => setTimeout(cb, 16)),
})

// Mock window.cancelAnimationFrame  
Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn((id) => clearTimeout(id)),
})

// matchMedia mock for accessibility enhancer
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Canvas getContext mock for WebGL detection (always override to avoid jsdom not-implemented error)
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  getExtension: jest.fn(),
  getParameter: jest.fn(),
}));