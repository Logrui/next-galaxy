# Pre-Locations Implementation Refactoring Guide

## Overview

This document provides a detailed analysis of the current codebase and specific refactoring recommendations before implementing the locations feature. The primary goal is to transform the monolithic `GalaxyCanvas.tsx` component into a maintainable, testable, and extensible architecture.

## Current Code Analysis

### **Critical Issues Identified**

#### **1. GalaxyCanvas.tsx - The God Component**
**Lines**: 544 lines (excessive for a single component)
**Responsibilities**: 12+ distinct concerns

```typescript
// Current problematic structure (simplified)
export default function GalaxyCanvas({ loadingParticleState }: GalaxyCanvasProps) {
  // 20+ refs for state management
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraInfoRef = useRef<HTMLDivElement | null>(null);
  const presetButtonsRef = useRef<HTMLDivElement | null>(null);
  // ... 17 more refs

  // Initialization logic (100+ lines)
  useEffect(() => {
    // Renderer setup
    // Scene creation
    // Camera initialization
    // Controls setup
    // Camera animator
    // UI panel creation
    // Texture loading
    // Animation loop setup
    // Event listeners
    // ... extensive cleanup logic
  }, []);

  // Multiple other useEffects for different concerns

  return <div ref={containerRef} />;
}
```

**Problems**:
- **Single Responsibility Violation**: Handles rendering, UI, interaction, animation, state management
- **Testing Difficulty**: Impossible to unit test individual features
- **Maintenance Nightmare**: Changes in one area affect multiple concerns
- **Memory Leaks**: Complex cleanup logic prone to errors
- **Performance Issues**: All logic runs in single component lifecycle

#### **2. State Management Issues**
**Current State**: Scattered across 20+ refs and multiple useEffect hooks

```typescript
// Scattered state management
const cameraInfoRef = useRef<HTMLDivElement | null>(null);
const presetButtonsRef = useRef<HTMLDivElement | null>(null);
const cameraAnimatorRef = useRef<CameraAnimator | null>(null);
const statusPanelRef = useRef<{ element: HTMLDivElement; update: ()=>void; destroy: ()=>void } | null>(null);
const loadingParticleStateRef = useRef<ParticleSystemState | null>(null);
const introReadyRef = useRef(false);
const introTriggeredRef = useRef(false);
// ... 13 more refs
```

**Problems**:
- **No Centralized State**: State is fragmented across multiple refs
- **State Synchronization Issues**: No way to ensure consistency between related state
- **Debugging Difficulty**: State changes are hard to track
- **Memory Management**: Refs can hold stale references

#### **3. Resource Management Issues**
**Current Pattern**: Resources created and cleaned up manually in useEffect

```typescript
// Manual resource management scattered throughout
useEffect(() => {
  const renderer = new THREE.WebGLRenderer({...});
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(...);
  const controls = new OrbitControls(...);
  // ... more resource creation

  return () => {
    // Manual cleanup of each resource
    if (animationHandle) animationHandle.stop();
    if (cameraAnimatorRef.current) cameraAnimatorRef.current.dispose();
    renderer.dispose();
    geo.dispose();
    material.dispose();
    // ... more cleanup
  };
}, []);
```

**Problems**:
- **Error-Prone Cleanup**: Easy to miss resources in cleanup
- **Resource Leaks**: Inconsistent cleanup patterns
- **Testing Complexity**: Hard to mock resources for testing
- **Lifecycle Issues**: Resources tied to React component lifecycle

## Specific Refactoring Recommendations

### **Phase 1: Extract Resource Managers**

#### **1.1 SceneManager - Three.js Scene Coordination**

**Create**: `app/galaxy/managers/SceneManager.ts`

```typescript
export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private materials: Map<string, THREE.Material>;
  private geometries: Map<string, THREE.BufferGeometry>;

  constructor(container: HTMLElement) {
    this.initializeRenderer(container);
    this.initializeScene();
    this.initializeCamera();
    this.initializeControls();
  }

  // Resource management methods
  addMaterial(name: string, material: THREE.Material): void;
  getMaterial(name: string): THREE.Material;
  addGeometry(name: string, geometry: THREE.BufferGeometry): void;
  dispose(): void; // Centralized cleanup
}
```

**Benefits**:
- **Centralized Resource Management**: All Three.js resources in one place
- **Consistent Lifecycle**: Proper initialization and cleanup patterns
- **Testability**: Easy to mock for unit tests
- **Resource Sharing**: Materials and geometries can be reused

#### **1.2 InteractionManager - Input Handling**

**Create**: `app/galaxy/managers/InteractionManager.ts`

```typescript
export class InteractionManager {
  private mode: 'fixed' | 'free' = 'free';
  private mousePosition: THREE.Vector2;
  private raycaster: THREE.Raycaster;
  private inputEvents: any;

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene
  ) {
    this.mousePosition = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.inputEvents = createInputEvents(renderer.domElement);
    this.setupEventListeners();
  }

  setMode(mode: 'fixed' | 'free'): void;
  getMousePosition(): THREE.Vector2;
  getIntersections(): THREE.Intersection[];
  dispose(): void;
}
```

**Benefits**:
- **Mode Management**: Clear separation of Fixed vs Free interaction modes
- **Event Handling**: Centralized mouse/keyboard input management
- **Raycasting**: Reusable intersection detection logic

#### **1.3 AnimationManager - Animation Loop Coordination**

**Create**: `app/galaxy/managers/AnimationManager.ts`

```typescript
export class AnimationManager {
  private animationId: number | null = null;
  private isRunning = false;
  private frameCallbacks: Set<(deltaTime: number) => void>;

  constructor() {
    this.frameCallbacks = new Set();
  }

  start(): void;
  stop(): void;
  addFrameCallback(callback: (deltaTime: number) => void): () => void;
  removeFrameCallback(callback: (deltaTime: number) => void): void;
}
```

**Benefits**:
- **Centralized Animation Loop**: Single animation loop for all animations
- **Performance Optimization**: Better frame rate management
- **Animation Coordination**: Synchronize multiple animations

### **Phase 2: State Management Refactoring**

#### **2.1 GalaxyStateManager - Centralized State**

**Create**: `app/galaxy/managers/GalaxyStateManager.ts`

```typescript
interface GalaxyState {
  currentLocation: string | null;
  interactionMode: 'fixed' | 'free';
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  visualParameters: VisualParameters;
  uiPanels: Map<string, boolean>;
  isInitialized: boolean;
  loadingProgress: number;
}

export class GalaxyStateManager {
  private state: GalaxyState;
  private listeners: Set<(state: GalaxyState) => void>;

  constructor(initialState?: Partial<GalaxyState>) {
    this.state = { ...this.getDefaultState(), ...initialState };
    this.listeners = new Set();
  }

  // State access methods
  getState(): Readonly<GalaxyState>;
  updateState(updates: Partial<GalaxyState>): void;

  // Subscription system
  subscribe(listener: (state: GalaxyState) => void): () => void;

  // Specific state updates
  setLocation(locationId: string): void;
  setInteractionMode(mode: 'fixed' | 'free'): void;
  updateVisualParameters(params: Partial<VisualParameters>): void;
}
```

**Benefits**:
- **Single Source of Truth**: All state in one place
- **State Validation**: Type-safe state updates
- **Change Tracking**: Clear state change history
- **Performance**: Efficient state updates and notifications

#### **2.2 ParameterManager - Visual Parameter Coordination**

**Create**: `app/galaxy/managers/ParameterManager.ts`

```typescript
interface VisualParameters {
  fdAlpha: number;
  focalDistance: number;
  aperture: number;
  nebulaAmp: number;
  phaseMix: number;
  dyingMix: number;
  pathMode: number;
  // ... other parameters
}

export class ParameterManager {
  private uniforms: any;
  private currentParameters: VisualParameters;
  private targetParameters: VisualParameters;
  private transitionProgress: Map<string, number>;

  constructor(uniforms: any) {
    this.uniforms = uniforms;
    this.transitionProgress = new Map();
  }

  // Parameter management
  setParameters(parameters: Partial<VisualParameters>): void;
  getParameters(): VisualParameters;
  getUniforms(): any;

  // Smooth transitions
  transitionToParameters(
    targetParameters: VisualParameters,
    duration: number = 2000,
    easing?: string
  ): Promise<void>;

  // Location-specific parameter sets
  applyLocationParameters(locationId: string): Promise<void>;
}
```

**Benefits**:
- **Coordinated Transitions**: Smooth parameter changes across all uniforms
- **Location-Specific Settings**: Predefined parameter sets per location
- **Performance**: Efficient uniform updates

### **Phase 3: Component Architecture Refactoring**

#### **3.1 GalaxyCanvas Refactoring**

**After Refactoring**:

```typescript
export default function GalaxyCanvas({ loadingParticleState }: GalaxyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateManager = useGalaxyStateManager();
  const sceneManager = useSceneManager(containerRef, stateManager);
  const interactionManager = useInteractionManager(sceneManager, stateManager);
  const animationManager = useAnimationManager(sceneManager, stateManager);
  const uiManager = useUIManager(sceneManager, stateManager);

  // Simple render - no complex logic
  return (
    <GalaxyContainer ref={containerRef}>
      <SceneRenderer sceneManager={sceneManager} />
      <UIManager uiManager={uiManager} />
    </GalaxyContainer>
  );
}
```

**Benefits**:
- **Focused Responsibility**: Only handles React lifecycle and composition
- **Easy Testing**: Each manager can be tested independently
- **Maintainability**: Changes isolated to specific concerns

#### **3.2 Custom Hooks for Managers**

**Create**: `app/galaxy/hooks/useGalaxyStateManager.ts`

```typescript
export function useGalaxyStateManager(initialState?: Partial<GalaxyState>) {
  const [stateManager] = useState(() => new GalaxyStateManager(initialState));

  useEffect(() => {
    // Setup state subscriptions if needed
    return () => {
      // Cleanup
    };
  }, []);

  return stateManager;
}
```

**Pattern**: Create custom hooks for each manager type.

### **Phase 4: UI System Refactoring**

#### **4.1 UIManager - Centralized UI Management**

**Create**: `app/galaxy/managers/UIManager.ts`

```typescript
export class UIManager {
  private container: HTMLElement;
  private panels: Map<string, Panel>;
  private stateManager: GalaxyStateManager;

  constructor(container: HTMLElement, stateManager: GalaxyStateManager) {
    this.container = container;
    this.panels = new Map();
    this.stateManager = stateManager;
  }

  // Panel management
  addPanel(id: string, panel: Panel): void;
  removePanel(id: string): void;
  showPanel(id: string): void;
  hidePanel(id: string): void;
  togglePanel(id: string): void;

  // Responsive positioning
  updatePanelPositions(camera: THREE.Camera): void;

  // Location-specific UI
  updateForLocation(locationId: string): void;
}
```

**Benefits**:
- **Centralized Panel Management**: All UI panels managed in one place
- **Position Management**: Automatic panel positioning based on camera
- **State Integration**: UI responds to state changes automatically

#### **4.2 Panel Base Class**

**Create**: `app/galaxy/ui/base/Panel.ts`

```typescript
export abstract class Panel {
  protected element: HTMLDivElement;
  protected container: HTMLElement;
  protected isVisible = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createElement();
    this.setupStyles();
    this.setupEventListeners();
  }

  abstract createElement(): HTMLDivElement;
  abstract update(data: any): void;

  show(): void {
    this.element.style.display = 'block';
    this.isVisible = true;
  }

  hide(): void {
    this.element.style.display = 'none';
    this.isVisible = false;
  }

  destroy(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}
```

**Benefits**:
- **Consistent Panel Interface**: All panels follow same pattern
- **Lifecycle Management**: Proper show/hide/destroy methods
- **Memory Management**: Automatic cleanup

## Implementation Priority

### **Phase 1: Critical Refactoring (Week 1)**

1. **Extract SceneManager** - Core Three.js resource management
2. **Extract InteractionManager** - Input handling and mode management
3. **Extract AnimationManager** - Animation loop coordination
4. **Create GalaxyStateManager** - Centralized state management

### **Phase 2: Component Refactoring (Week 2)**

1. **Refactor GalaxyCanvas** - Use managers instead of direct implementation
2. **Create custom hooks** - For each manager type
3. **Update existing UI panels** - To work with new UIManager

### **Phase 3: Enhanced Systems (Week 3)**

1. **ParameterManager** - Visual parameter coordination
2. **UIManager** - Centralized UI management
3. **Panel base class** - Consistent panel implementation

## Testing Strategy

### **Unit Testing**
```typescript
describe('SceneManager', () => {
  it('should initialize renderer with correct settings', () => {
    const container = document.createElement('div');
    const sceneManager = new SceneManager(container);

    expect(sceneManager.getRenderer().outputColorSpace).toBe(THREE.SRGBColorSpace);
  });

  it('should dispose all resources properly', () => {
    const container = document.createElement('div');
    const sceneManager = new SceneManager(container);

    sceneManager.dispose();

    // Verify all resources are cleaned up
  });
});
```

### **Integration Testing**
```typescript
describe('GalaxyCanvas Integration', () => {
  it('should coordinate all managers properly', () => {
    render(<GalaxyCanvas />);

    // Test that all managers are initialized
    // Test that state changes propagate correctly
    // Test that resources are cleaned up on unmount
  });
});
```

## Risk Assessment & Mitigation

### **High-Risk Areas**

#### **1. State Manager Introduction**
**Risk**: Breaking existing state-dependent functionality
**Mitigation**:
- Incremental rollout with feature flags
- Comprehensive integration testing
- Gradual migration of state usage

#### **2. Resource Manager Extraction**
**Risk**: Memory leaks or resource conflicts
**Mitigation**:
- Careful resource lifecycle management
- Extensive memory profiling
- Resource usage monitoring

#### **3. Animation Loop Changes**
**Risk**: Performance regression or animation glitches
**Mitigation**:
- Frame rate monitoring during development
- Gradual rollout with performance benchmarks
- Fallback to original animation system if issues arise

### **Medium-Risk Areas**

#### **1. UI Panel Refactoring**
**Risk**: Breaking existing UI functionality
**Mitigation**:
- Panel interface compatibility layer
- Gradual migration of existing panels
- UI regression testing

#### **2. Parameter Management**
**Risk**: Visual glitches during transitions
**Mitigation**:
- Smooth transition algorithms
- Visual debugging tools
- User feedback collection

## Success Metrics

### **Code Quality Metrics**
- **Cyclomatic Complexity**: GalaxyCanvas.tsx complexity reduced from 50+ to <10
- **Test Coverage**: 90%+ coverage for all new managers
- **Type Safety**: 100% TypeScript coverage for refactored code
- **Performance**: No regression in frame rate or memory usage

### **Development Experience**
- **Build Time**: No significant increase in build times
- **Hot Reload**: Maintains fast refresh capabilities
- **Debugging**: Improved debugging experience with centralized state
- **Code Navigation**: Easier to find and modify specific functionality

### **Maintainability**
- **Single Responsibility**: Each module has clear, focused responsibility
- **Dependency Clarity**: Clear dependency relationships between modules
- **Extension Points**: Easy to add new features without modifying existing code
- **Documentation**: Comprehensive documentation for all public APIs

## Migration Strategy

### **Step 1: Create Manager Infrastructure**
1. Create all manager classes with basic functionality
2. Create custom hooks for React integration
3. Set up dependency injection pattern

### **Step 2: Parallel Implementation**
1. Run original GalaxyCanvas alongside new architecture
2. Gradually migrate features to new system
3. Feature flags for rollback capability

### **Step 3: Validation & Testing**
1. Comprehensive test suite for all managers
2. Performance benchmarking
3. User acceptance testing

### **Step 4: Cleanup**
1. Remove original implementation
2. Clean up temporary code
3. Update documentation

## Conclusion

This refactoring establishes a solid foundation for the locations feature implementation while significantly improving code maintainability, testability, and extensibility. The modular architecture will make future enhancements much easier and provide better separation of concerns for long-term maintainability.

The phased approach ensures that each component is thoroughly tested before moving to the next phase, reducing the risk of integration issues and providing clear milestones for progress tracking.
