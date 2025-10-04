# Data Model: Galaxy Canvas Architecture Refactoring

**Feature**: 001-refactor-prior-to  
**Date**: 2025-10-01  
**Status**: Complete

## Entity Definitions

---

### 1. GalaxyStateManager

**Purpose**: Central state store for all galaxy visualization state with subscription-based change notifications.

**Fields**:
```typescript
interface GalaxyState {
  // Camera state
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  
  // Interaction state
  interactionMode: 'fixed' | 'free';
  currentLocation: string | null;
  
  // Visual state
  visualParameters: VisualParameters;
  
  // UI state
  uiPanels: Map<string, boolean>;  // panelId → isVisible
  
  // System state
  isInitialized: boolean;
  loadingProgress: number;  // 0-1
}

class GalaxyStateManager {
  private state: GalaxyState;
  private listeners: Set<(state: GalaxyState) => void>;
}
```

**Relationships**:
- **Observed by**: All other managers (SceneManager, AnimationManager, InteractionManager, ParameterManager, UIManager)
- **Updates from**: InteractionManager (user input), ParameterManager (visual changes), UIManager (panel state)

**State Transitions**:
```
Initial State → isInitialized: false
  ↓ (managers initialized)
Ready State → isInitialized: true
  ↓ (user interaction)
Active State → interactionMode updated, visualParameters modified
  ↓ (location navigation - future)
Location State → currentLocation set, visualParameters transition
```

**Validation Rules**:
- `loadingProgress` must be 0-1 inclusive
- `interactionMode` must be 'fixed' or 'free'
- `cameraPosition` and `cameraTarget` must be finite vectors
- State updates must be atomic (no partial updates visible)
- Type safety enforced by TypeScript strict mode

**Methods**:
```typescript
getState(): Readonly<GalaxyState>
updateState(updates: Partial<GalaxyState>): void
subscribe(listener: (state: GalaxyState) => void): () => void
setLocation(locationId: string): void
setInteractionMode(mode: 'fixed' | 'free'): void
updateVisualParameters(params: Partial<VisualParameters>): void
```

---

### 2. SceneManager

**Purpose**: Coordinates Three.js scene, renderer, camera, and controls lifecycle with centralized resource tracking and disposal.

**Fields**:
```typescript
class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private materials: Map<string, THREE.Material>;
  private geometries: Map<string, THREE.BufferGeometry>;
  private container: HTMLElement;
}
```

**Relationships**:
- **Uses**: GalaxyStateManager (reads camera state)
- **Used by**: AnimationManager (rendering), InteractionManager (raycasting), UIManager (camera positioning)
- **Owns**: All Three.js resources (renderer, scene, camera, controls, materials, geometries)

**Lifecycle**:
```
Constructor → initialize renderer, scene, camera
  ↓
Setup → create controls, register resources
  ↓
Active → resource access via getters
  ↓
Dispose → cleanup all registered resources
```

**Resource Tracking**:
- All materials registered in `materials` Map with string keys
- All geometries registered in `geometries` Map with string keys
- Disposal iterates Maps and calls `.dispose()` on each resource
- Idempotent disposal (safe to call multiple times)

**Validation Rules**:
- Container must be valid HTMLElement
- Renderer must support WebGL (fallback handling in parent)
- Camera aspect ratio must match container dimensions
- All registered resources must have `.dispose()` method

**Methods**:
```typescript
constructor(container: HTMLElement)
getRenderer(): THREE.WebGLRenderer
getScene(): THREE.Scene
getCamera(): THREE.PerspectiveCamera
getControls(): OrbitControls
addMaterial(name: string, material: THREE.Material): void
getMaterial(name: string): THREE.Material | undefined
addGeometry(name: string, geometry: THREE.BufferGeometry): void
getGeometry(name: string): THREE.BufferGeometry | undefined
resize(width: number, height: number): void
dispose(): void
```

---

### 3. AnimationManager

**Purpose**: Coordinates the main animation loop and manages frame callbacks from multiple subsystems.

**Fields**:
```typescript
class AnimationManager {
  private animationId: number | null;
  private isRunning: boolean;
  private frameCallbacks: Set<(deltaTime: number) => void>;
  private lastTime: number;
  private clock: THREE.Clock;  // For accurate delta time
}
```

**Relationships**:
- **Coordinates**: SceneManager (rendering), ParameterManager (transitions), any time-based updates
- **Independent of**: State updates (callbacks handle their own state reads)

**Lifecycle**:
```
Constructor → initialize callback set, clock
  ↓
start() → begin RAF loop
  ↓
Running → execute callbacks each frame
  ↓
stop() → cancel RAF, preserve state
  ↓
dispose() → cleanup callbacks, stop loop
```

**Animation Loop**:
```typescript
private animate(time: number) {
  const deltaTime = this.clock.getDelta();
  
  // Execute all registered callbacks
  this.frameCallbacks.forEach(callback => {
    try {
      callback(deltaTime);
    } catch (error) {
      console.error('Animation callback error:', error);
    }
  });
  
  if (this.isRunning) {
    this.animationId = requestAnimationFrame(this.animate);
  }
}
```

**Validation Rules**:
- Only one RAF loop active at a time
- Callbacks must not throw uncaught errors (try-catch wrapper)
- Delta time capped at reasonable maximum (prevent time jumps)
- Frame budget monitored (warning if callbacks exceed 16ms)

**Methods**:
```typescript
start(): void
stop(): void
pause(): void
resume(): void
addFrameCallback(callback: (deltaTime: number) => void): () => void
removeFrameCallback(callback: (deltaTime: number) => void): void
isAnimating(): boolean
dispose(): void
```

---

### 4. InteractionManager

**Purpose**: Handles mouse/keyboard input events, raycasting, and interaction mode (fixed vs free) switching.

**Fields**:
```typescript
class InteractionManager {
  private mode: 'fixed' | 'free';
  private mousePosition: THREE.Vector2;
  private raycaster: THREE.Raycaster;
  private inputEvents: any;  // From createInteraction.ts
  private sceneManager: SceneManager;
  private stateManager: GalaxyStateManager;
  private eventListeners: Map<string, EventListener>;
}
```

**Relationships**:
- **Reads from**: SceneManager (camera, scene for raycasting)
- **Updates**: GalaxyStateManager (interaction mode, mouse position)
- **Independent**: Can switch modes without affecting other managers

**Mode Transitions**:
```
Free Mode:
  - OrbitControls enabled
  - Mouse drag orbits camera
  - Wheel zooms camera
  
  ↓ setMode('fixed')
  
Fixed Mode:
  - OrbitControls disabled
  - Mouse position tracked for parallax
  - Camera locked (no user camera control)
  - Location-based navigation only
```

**Event Handling**:
- Mouse move → update mousePosition in state
- Mouse click → raycast intersection detection
- Keyboard (future) → location navigation shortcuts
- Window resize → update raycaster projection

**Validation Rules**:
- Mode must be 'fixed' or 'free'
- Mouse position normalized to [-1, 1] range
- Event listeners cleaned up on mode switch
- Raycaster configured for current camera

**Methods**:
```typescript
constructor(sceneManager: SceneManager, stateManager: GalaxyStateManager)
setMode(mode: 'fixed' | 'free'): void
getMode(): 'fixed' | 'free'
getMousePosition(): THREE.Vector2
getIntersections(objects: THREE.Object3D[]): THREE.Intersection[]
dispose(): void
```

---

### 5. ParameterManager

**Purpose**: Manages visual shader parameters with support for smooth transitions between parameter sets.

**Fields**:
```typescript
interface VisualParameters {
  fdAlpha: number;        // Depth-of-field intensity
  focalDistance: number;  // Focus point
  aperture: number;       // Blur intensity
  nebulaAmp: number;      // Particle wiggle intensity
  phaseMix: number;       // Galaxy formation phase
  dyingMix: number;       // Dying star phase
  pathMode: number;       // Particle path mode (0-7)
  superScale: number;     // Particle size multiplier
  // ... other shader uniforms
}

class ParameterManager {
  private uniforms: any;  // Three.js ShaderMaterial uniforms
  private currentParameters: VisualParameters;
  private targetParameters: VisualParameters;
  private transitionProgress: Map<string, number>;
  private stateManager: GalaxyStateManager;
}
```

**Relationships**:
- **Reads from**: GalaxyStateManager (visual parameter state)
- **Updates**: Three.js shader uniforms (material.uniforms)
- **Used by**: Future location system (parameter sets per location)

**Transition System**:
```
Current State → setParameters() → Immediate update
  ↓
Current State → transitionToParameters() → GSAP animation
  ↓ (duration: 2000ms, easing: Power2.easeInOut)
Intermediate States → uniforms updated each frame
  ↓ (completion)
Target State → transition promise resolved
```

**Parameter Validation**:
```typescript
// Each parameter has bounds
fdAlpha: 0-1
focalDistance: 0-1000
aperture: 0-10000
nebulaAmp: 0-10
phaseMix: 0-1
dyingMix: 0-1
pathMode: 0-7 (integer)
superScale: 0-10
```

**Methods**:
```typescript
constructor(uniforms: any, stateManager: GalaxyStateManager)
setParameters(parameters: Partial<VisualParameters>): void
getParameters(): VisualParameters
getUniforms(): any
transitionToParameters(
  targetParameters: Partial<VisualParameters>,
  duration?: number,
  easing?: string
): Promise<void>
applyLocationParameters(locationId: string): Promise<void>  // Future
dispose(): void
```

---

### 6. UIManager

**Purpose**: Coordinates all UI overlay panels with lifecycle management and positioning.

**Fields**:
```typescript
class UIManager {
  private container: HTMLElement;
  private panels: Map<string, Panel>;
  private stateManager: GalaxyStateManager;
  private sceneManager: SceneManager;
}
```

**Relationships**:
- **Observes**: GalaxyStateManager (panel visibility state)
- **Uses**: SceneManager (camera for positioning)
- **Manages**: All Panel instances (camera info, presets, phase controls, etc.)

**Panel Lifecycle**:
```
addPanel(id, panel) → panel created, added to DOM
  ↓
showPanel(id) → panel.show(), state updated
  ↓
Active → panel updates with data
  ↓
hidePanel(id) → panel.hide(), state updated
  ↓
removePanel(id) → panel.destroy(), removed from DOM
```

**Panel Positioning**:
- Fixed positioning relative to viewport
- Optional camera-relative positioning (future)
- Responsive layout adjustments
- Z-index management

**Validation Rules**:
- Panel IDs must be unique
- Panel must extend base Panel class
- Container must be valid HTMLElement
- State updates synchronized with panel visibility

**Methods**:
```typescript
constructor(container: HTMLElement, stateManager: GalaxyStateManager, sceneManager: SceneManager)
addPanel(id: string, panel: Panel): void
removePanel(id: string): void
showPanel(id: string): void
hidePanel(id: string): void
togglePanel(id: string): void
updatePanelPositions(camera: THREE.Camera): void  // Future
updateForLocation(locationId: string): void  // Future
dispose(): void
```

---

### 7. Panel (Base Class)

**Purpose**: Base abstraction for UI overlay panels with consistent show/hide/destroy lifecycle.

**Fields**:
```typescript
abstract class Panel {
  protected element: HTMLDivElement;
  protected container: HTMLElement;
  protected isVisible: boolean;
}
```

**Relationships**:
- **Extended by**: CameraInfoPanel, PresetButtonsPanel, PhasePanel, StatusPanel, PathPanel
- **Managed by**: UIManager
- **Independent**: No cross-panel dependencies

**Lifecycle**:
```
Constructor → createElement(), setupStyles()
  ↓
setupEventListeners() → attach DOM events
  ↓
show() → element.style.display = 'block'
  ↓
update(data) → refresh panel content
  ↓
hide() → element.style.display = 'none'
  ↓
destroy() → remove from DOM, cleanup events
```

**Abstract Methods** (must implement):
```typescript
abstract createElement(): HTMLDivElement
abstract update(data: any): void
```

**Concrete Methods** (provided by base):
```typescript
show(): void
hide(): void
toggle(): void
isShown(): boolean
destroy(): void
```

**Styling**:
- Glassmorphism design language
- Semi-transparent backgrounds with backdrop blur
- Consistent padding, margins, border radius
- High contrast text (4.5:1 minimum)
- Smooth transitions (300ms)

---

### 8. VisualParameters

**Purpose**: Data structure containing all shader uniform values for visual effects.

**Structure**:
```typescript
interface VisualParameters {
  // Depth of field
  fdAlpha: number;        // 0-1, depth-of-field intensity
  focalDistance: number;  // 0-1000, focus point distance
  aperture: number;       // 0-10000, blur intensity
  
  // Particle animation
  nebulaAmp: number;      // 0-10, wiggle intensity
  superScale: number;     // 0-10, size multiplier
  
  // Galaxy phases
  phaseMix: number;       // 0-1, galaxy → nebula mix
  dyingMix: number;       // 0-1, nebula → dying star mix
  
  // Particle paths
  pathMode: number;       // 0-7, particle movement pattern
  
  // Camera (future)
  cameraDistance: number; // Camera zoom distance
  
  // Color (future)
  colorScheme: number;    // Color palette selector
}
```

**Usage**:
- Stored in GalaxyState
- Managed by ParameterManager
- Applied to Three.js shader uniforms
- Transitioned smoothly between states

**Validation**:
All fields have defined ranges enforced by ParameterManager

---

### 9. GalaxyState

**Purpose**: Data structure containing application state (current location, interaction mode, camera position, loading progress, etc.)

**Structure**:
```typescript
interface GalaxyState {
  // Camera
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  
  // Interaction
  interactionMode: 'fixed' | 'free';
  currentLocation: string | null;
  
  // Visual
  visualParameters: VisualParameters;
  
  // UI
  uiPanels: Map<string, boolean>;
  
  // System
  isInitialized: boolean;
  loadingProgress: number;  // 0-1
}
```

**Default State**:
```typescript
{
  cameraPosition: new THREE.Vector3(0, 150, 300),
  cameraTarget: new THREE.Vector3(0, 0, 0),
  interactionMode: 'free',
  currentLocation: null,
  visualParameters: {
    fdAlpha: 0,
    focalDistance: 500,
    aperture: 0,
    nebulaAmp: 0.5,
    superScale: 1.0,
    phaseMix: 0,
    dyingMix: 0,
    pathMode: 0,
  },
  uiPanels: new Map(),
  isInitialized: false,
  loadingProgress: 0,
}
```

---

## Entity Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      GalaxyStateManager                          │
│                    (Central State Store)                         │
│  - state: GalaxyState                                           │
│  - listeners: Set<Listener>                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ Observed by
                     │
        ┌────────────┼────────────┬──────────────┬────────────────┐
        │            │            │              │                │
        ▼            ▼            ▼              ▼                ▼
┌──────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────┐
│SceneManager  │ │Animation    │ │Interaction  │ │Parameter   │ │UI        │
│              │ │Manager      │ │Manager      │ │Manager     │ │Manager   │
│- renderer    │ │- frameCallbacks│- mode      │ │- uniforms  │ │- panels  │
│- scene       │ │- animationId│ │- mouse     │ │- current   │ │- container│
│- camera      │ │             │ │- raycaster │ │- target    │ │          │
│- materials   │ │             │ │            │ │            │ │          │
│- geometries  │ │             │ │            │ │            │ │          │
└──────────────┘ └─────────────┘ └─────────────┘ └────────────┘ └────┬─────┘
                                                                       │
                                                                       │ Manages
                                                                       │
                                                         ┌─────────────▼──────┐
                                                         │ Panel (Base Class) │
                                                         │ - element          │
                                                         │ - container        │
                                                         │ - isVisible        │
                                                         └────────────────────┘
                                                                  │ Extended by
                                                                  │
                                         ┌────────────────────────┼────────────────────────┐
                                         │                        │                        │
                                    ┌────▼─────┐           ┌─────▼────┐          ┌────────▼─────┐
                                    │Camera    │           │Preset    │          │Phase         │
                                    │InfoPanel │           │Buttons   │          │Panel         │
                                    └──────────┘           │Panel     │          └──────────────┘
                                                           └──────────┘
```

---

## Data Flow

### Initialization Flow
```
1. GalaxyCanvas mounts
   ↓
2. Create GalaxyStateManager (initial state)
   ↓
3. Create SceneManager (Three.js setup)
   ↓
4. Create AnimationManager, start loop
   ↓
5. Create InteractionManager, setup events
   ↓
6. Create ParameterManager, link uniforms
   ↓
7. Create UIManager, create panels
   ↓
8. StateManager.updateState({ isInitialized: true })
   ↓
9. All managers notified, begin operation
```

### User Interaction Flow
```
1. User moves mouse
   ↓
2. InteractionManager captures event
   ↓
3. InteractionManager.updateState({ mousePosition })
   ↓
4. GalaxyStateManager notifies listeners
   ↓
5. ParameterManager receives update (future: parallax)
   ↓
6. Next frame: uniforms updated
```

### Visual Parameter Change Flow
```
1. User adjusts GUI slider
   ↓
2. ParameterManager.transitionToParameters({ fdAlpha: 0.8 })
   ↓
3. GSAP tween created (2s duration)
   ↓
4. Each frame: uniform values interpolated
   ↓
5. StateManager.updateState({ visualParameters })
   ↓
6. Transition complete, promise resolved
```

---

## Conclusion

All entities defined with clear fields, relationships, lifecycles, and validation rules. Observer pattern connects GalaxyStateManager to all other managers. Resource lifecycle managed through SceneManager disposal registry. Animation coordination through single RAF loop. Type safety enforced throughout with TypeScript strict mode.

**Status**: ✅ Ready for Phase 2 (Task Planning)

