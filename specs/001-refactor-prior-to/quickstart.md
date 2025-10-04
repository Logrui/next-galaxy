# Quickstart Guide: Galaxy Canvas Manager System

**Feature**: 001-refactor-prior-to  
**Date**: 2025-10-01  
**Audience**: Developers working with the refactored Galaxy Canvas architecture

## Overview

This guide provides quick reference for using the new manager-based architecture for Galaxy Canvas. After refactoring, the monolithic 544-line component is split into 7 focused managers, each with clear responsibilities and lifecycle management.

---

## Architecture Overview

```
GalaxyCanvas.tsx (React Component)
    ↓ uses hooks
    ├── useGalaxyStateManager()     → GalaxyStateManager
    ├── useSceneManager()            → SceneManager
    ├── useAnimationManager()        → AnimationManager
    ├── useInteractionManager()      → InteractionManager
    ├── useParameterManager()        → ParameterManager
    └── useUIManager()               → UIManager
```

**Key Principle**: Each manager is a class with explicit lifecycle (constructor → methods → dispose). React hooks bridge manager lifecycle to component lifecycle.

---

## Quick Start: Basic Usage

### 1. Import Hooks

```typescript
import {
  useGalaxyStateManager,
  useSceneManager,
  useAnimationManager,
  useInteractionManager,
  useParameterManager,
  useUIManager,
} from '@/app/galaxy/hooks';
```

### 2. Initialize Managers in Component

```typescript
export default function GalaxyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 1. State manager first (foundation)
  const stateManager = useGalaxyStateManager();
  
  // 2. Scene manager (requires container)
  const sceneManager = useSceneManager(containerRef, stateManager);
  
  // 3. Animation manager
  const animationManager = useAnimationManager(sceneManager, stateManager);
  
  // 4. Interaction manager
  const interactionManager = useInteractionManager(sceneManager, stateManager);
  
  // 5. Parameter manager
  const parameterManager = useParameterManager(sceneManager, stateManager);
  
  // 6. UI manager
  const uiManager = useUIManager(containerRef, sceneManager, stateManager);
  
  return <div ref={containerRef} className="galaxy-container" />;
}
```

**Order Matters**: Initialize managers in dependency order (state → scene → others).

---

## Manager Reference

### GalaxyStateManager

**Purpose**: Central state store with observer pattern.

**Common Operations**:

```typescript
// Get current state (readonly)
const state = stateManager.getState();

// Update state (notifies all listeners)
stateManager.updateState({
  interactionMode: 'fixed',
  visualParameters: { ...state.visualParameters, fdAlpha: 0.8 }
});

// Subscribe to state changes
useEffect(() => {
  const unsubscribe = stateManager.subscribe((newState) => {
    console.log('State changed:', newState);
  });
  return unsubscribe;
}, []);

// Convenience methods
stateManager.setInteractionMode('fixed');
stateManager.updateVisualParameters({ nebulaAmp: 2.0 });
```

**When to use**:
- Need to access or modify any application state
- Need to react to state changes from other managers
- Coordinating multiple managers

---

### SceneManager

**Purpose**: Three.js resource lifecycle management.

**Common Operations**:

```typescript
// Access core Three.js objects
const renderer = sceneManager.getRenderer();
const scene = sceneManager.getScene();
const camera = sceneManager.getCamera();
const controls = sceneManager.getControls();

// Register materials for automatic disposal
sceneManager.addMaterial('galaxyMaterial', new THREE.ShaderMaterial({...}));
const material = sceneManager.getMaterial('galaxyMaterial');

// Register geometries
sceneManager.addGeometry('points', new THREE.BufferGeometry());

// Handle window resize
window.addEventListener('resize', () => {
  sceneManager.resize(window.innerWidth, window.innerHeight);
});

// Cleanup (automatic via hook)
// sceneManager.dispose() called on unmount
```

**When to use**:
- Creating Three.js resources (materials, geometries)
- Accessing renderer, scene, camera, controls
- Ensuring proper resource cleanup

---

### AnimationManager

**Purpose**: Coordinate frame-based updates in single RAF loop.

**Common Operations**:

```typescript
// Start animation loop (usually automatic via hook)
animationManager.start();

// Register frame callback
useEffect(() => {
  const unsubscribe = animationManager.addFrameCallback((deltaTime) => {
    // Called every frame with delta time in seconds
    updateCustomAnimation(deltaTime);
  });
  return unsubscribe; // Cleanup callback
}, []);

// Pause/Resume
animationManager.pause();
animationManager.resume();

// Check if animating
if (animationManager.isAnimating()) {
  console.log('Animation running');
}

// Stop animation (usually automatic via hook)
// animationManager.stop();
```

**When to use**:
- Need to run code every frame
- Time-based animations or updates
- Synchronizing multiple animations

**Performance Tip**: Keep frame callbacks < 10ms execution time.

---

### InteractionManager

**Purpose**: Handle user input and manage interaction modes.

**Common Operations**:

```typescript
// Switch interaction mode
interactionManager.setMode('fixed');  // Lock camera
interactionManager.setMode('free');   // Allow camera orbit

// Get current mode
const mode = interactionManager.getMode();

// Get normalized mouse position (-1 to 1)
const mousePos = interactionManager.getMousePosition();

// Raycast for object intersections
const objects = [scene.children[0]]; // Objects to test
const intersections = interactionManager.getIntersections(objects);
if (intersections.length > 0) {
  console.log('Hit object:', intersections[0].object);
}
```

**When to use**:
- Switching between fixed/free interaction modes
- Detecting mouse position for parallax effects
- Raycasting for object selection

**Mode Behavior**:
- **Free Mode**: OrbitControls enabled, user can orbit/zoom camera
- **Fixed Mode**: Camera locked, mouse position tracked for parallax

---

### ParameterManager

**Purpose**: Manage visual shader parameters with smooth transitions.

**Common Operations**:

```typescript
// Immediate parameter update
parameterManager.setParameters({
  fdAlpha: 0.8,
  nebulaAmp: 2.0,
});

// Get current parameters
const params = parameterManager.getParameters();

// Smooth transition (returns promise)
await parameterManager.transitionToParameters(
  { fdAlpha: 1.0, focalDistance: 300 },
  2000,  // duration in ms
  'Power2.easeInOut'  // GSAP easing
);

// Access Three.js uniforms directly (advanced)
const uniforms = parameterManager.getUniforms();
uniforms.customValue.value = 5.0;
```

**When to use**:
- Changing visual effects (depth-of-field, nebula, etc.)
- Creating smooth visual transitions
- Responding to UI control changes

**Parameter Ranges**:
- `fdAlpha`: 0-1 (depth-of-field intensity)
- `focalDistance`: 0-1000 (focus distance)
- `aperture`: 0-10000 (blur intensity)
- `nebulaAmp`: 0-10 (wiggle intensity)
- `phaseMix`: 0-1 (galaxy phase)
- `dyingMix`: 0-1 (dying star phase)
- `pathMode`: 0-7 (particle path)

---

### UIManager

**Purpose**: Coordinate UI overlay panels.

**Common Operations**:

```typescript
// Create and add panel
import { CameraInfoPanel } from '@/app/galaxy/ui/CameraInfoPanel';

const cameraPanel = new CameraInfoPanel(containerRef.current!);
uiManager.addPanel('camera-info', cameraPanel);

// Show/hide panels
uiManager.showPanel('camera-info');
uiManager.hidePanel('camera-info');
uiManager.togglePanel('camera-info');

// Remove panel (calls destroy)
uiManager.removePanel('camera-info');

// Update all panel positions (future: camera-relative)
uiManager.updatePanelPositions(camera);
```

**When to use**:
- Adding new UI overlay panels
- Managing panel visibility
- Coordinating panel lifecycle

---

## Creating Custom Managers

If you need to add a new manager:

### 1. Create Manager Class

```typescript
// app/galaxy/managers/CustomManager.ts
import { GalaxyStateManager } from './GalaxyStateManager';

export class CustomManager {
  private stateManager: GalaxyStateManager;
  private unsubscribe: (() => void) | null = null;
  
  constructor(stateManager: GalaxyStateManager) {
    this.stateManager = stateManager;
    
    // Subscribe to state changes
    this.unsubscribe = stateManager.subscribe((state) => {
      this.handleStateChange(state);
    });
  }
  
  private handleStateChange(state: GalaxyState): void {
    // React to state changes
  }
  
  public doSomething(): void {
    // Public method
  }
  
  public dispose(): void {
    // Cleanup
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
```

### 2. Create React Hook

```typescript
// app/galaxy/hooks/useCustomManager.ts
import { useEffect, useState } from 'react';
import { CustomManager } from '../managers/CustomManager';
import { GalaxyStateManager } from '../managers/GalaxyStateManager';

export function useCustomManager(stateManager: GalaxyStateManager) {
  const [manager] = useState(() => new CustomManager(stateManager));
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      manager.dispose();
    };
  }, [manager]);
  
  return manager;
}
```

### 3. Use in Component

```typescript
const customManager = useCustomManager(stateManager);
```

---

## Creating Custom UI Panels

### 1. Extend Panel Base Class

```typescript
// app/galaxy/ui/CustomPanel.ts
import { Panel } from './base/Panel';

export class CustomPanel extends Panel {
  protected createElement(): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'custom-panel';
    element.innerHTML = `
      <div class="panel-content">
        <h3>Custom Panel</h3>
        <p id="custom-text">Content</p>
      </div>
    `;
    this.container.appendChild(element);
    return element;
  }
  
  public update(data: { text: string }): void {
    const textEl = this.element.querySelector('#custom-text');
    if (textEl) {
      textEl.textContent = data.text;
    }
  }
  
  protected setupStyles(): void {
    // Apply glassmorphism styles
    this.element.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 16px;
      color: white;
    `;
  }
}
```

### 2. Register with UIManager

```typescript
const customPanel = new CustomPanel(containerRef.current!);
uiManager.addPanel('custom', customPanel);

// Update panel
customPanel.update({ text: 'Updated text' });
```

---

## Common Patterns

### Pattern 1: React to State Changes

```typescript
useEffect(() => {
  const unsubscribe = stateManager.subscribe((state) => {
    if (state.interactionMode === 'fixed') {
      // Handle fixed mode
    }
  });
  return unsubscribe;
}, [stateManager]);
```

### Pattern 2: Coordinate Multiple Managers

```typescript
// Update state, all managers notified automatically
stateManager.updateState({
  interactionMode: 'fixed',
  visualParameters: { fdAlpha: 0.8 }
});

// InteractionManager disables controls
// ParameterManager updates uniforms
// UIManager shows/hides relevant panels
```

### Pattern 3: Safe Resource Cleanup

```typescript
useEffect(() => {
  // Create resource
  const geometry = new THREE.BufferGeometry();
  sceneManager.addGeometry('myGeometry', geometry);
  
  // Cleanup automatic via SceneManager.dispose()
  return () => {
    // Additional cleanup if needed
  };
}, [sceneManager]);
```

### Pattern 4: Frame-based Animation

```typescript
useEffect(() => {
  let rotation = 0;
  
  const unsubscribe = animationManager.addFrameCallback((deltaTime) => {
    rotation += deltaTime;
    object.rotation.y = rotation;
  });
  
  return unsubscribe;
}, [animationManager, object]);
```

---

## Troubleshooting

### Manager not working after hot reload?
- React hooks preserve manager instances across hot reloads
- If issues persist, full page refresh may be needed
- Check that dispose() is called properly in cleanup

### Memory leaks?
- Verify all managers have dispose() methods
- Check SceneManager resource registry is being used
- Ensure animation callbacks are unregistered
- Use React DevTools Profiler to check for leaks

### State updates not propagating?
- Verify using `stateManager.updateState()` not direct mutation
- Check that managers are subscribing to state changes
- Ensure subscriptions are set up before state updates

### Performance issues?
- Check animation callback execution times (should be < 10ms)
- Verify only one RAF loop is running (AnimationManager)
- Use Chrome DevTools Performance tab to profile
- Check for unnecessary re-renders in React components

---

## Testing

### Unit Testing Managers

```typescript
import { GalaxyStateManager } from '../managers/GalaxyStateManager';

describe('GalaxyStateManager', () => {
  it('should update state and notify listeners', () => {
    const manager = new GalaxyStateManager();
    const listener = jest.fn();
    
    manager.subscribe(listener);
    manager.updateState({ interactionMode: 'fixed' });
    
    expect(listener).toHaveBeenCalled();
    expect(manager.getState().interactionMode).toBe('fixed');
  });
});
```

### Integration Testing

```typescript
import { render } from '@testing-library/react';
import GalaxyCanvas from '../GalaxyCanvas';

describe('GalaxyCanvas Integration', () => {
  it('should initialize all managers', () => {
    const { container } = render(<GalaxyCanvas />);
    
    // Verify managers initialized
    expect(container.querySelector('.galaxy-container')).toBeInTheDocument();
  });
});
```

---

## Performance Best Practices

1. **Keep frame callbacks lightweight** (< 10ms)
2. **Use state subscriptions judiciously** (only subscribe when needed)
3. **Dispose managers properly** (prevent memory leaks)
4. **Batch state updates** (single updateState() call for multiple changes)
5. **Use parameter transitions** (smooth visual changes, not immediate)
6. **Register resources with SceneManager** (automatic cleanup)
7. **Avoid creating new objects in animation loops** (object pooling)

---

## Next Steps

- Review [data-model.md](./data-model.md) for detailed entity definitions
- Review [research.md](./research.md) for architectural decisions
- See tasks.md (after `/tasks` command) for implementation order
- Refer to REFACTORING_GUIDE.md for detailed implementation patterns

---

## Support

Questions or issues? Check:
- **data-model.md**: Entity relationships and validation rules
- **research.md**: Design decision rationale
- **REFACTORING_GUIDE.md**: Detailed implementation guidance
- **Constitution**: `.specify/memory/constitution.md` for quality standards

**Status**: ✅ Developer reference complete

