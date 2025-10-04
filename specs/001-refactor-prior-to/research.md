# Research: Galaxy Canvas Architecture Refactoring

**Feature**: 001-refactor-prior-to  
**Date**: 2025-10-01  
**Status**: Complete

## Research Questions & Decisions

### 1. Manager Pattern in React Applications

**Question**: What architectural pattern should we use for extracting concerns from the monolithic GalaxyCanvas component?

**Decision**: **Class-based managers with React hooks for lifecycle integration**

**Rationale**:
- **Clear Resource Ownership**: Classes provide explicit constructor/dispose patterns matching Three.js resource lifecycle
- **Encapsulation**: Private fields protect implementation details, public methods provide controlled API
- **React Integration**: Custom hooks bridge class lifecycle to React component lifecycle
- **Testability**: Classes can be instantiated and tested independently of React
- **Memory Safety**: Explicit dispose methods ensure proper cleanup

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Zustand/Redux | Too heavy for internal refactoring, adds external dependency, over-engineering for this scope |
| Pure React Context | Performance issues with frequent state updates (60fps), poor encapsulation, cleanup complexity |
| Functional Modules | Resource cleanup patterns unclear, shared mutable state problematic, harder to test |
| Service Locator | Over-engineered, adds indirection, breaks explicit dependencies |

**References**:
- REFACTORING_GUIDE.md Phases 1-2
- React Hooks documentation for custom hooks
- Three.js resource management patterns

---

### 2. Three.js Resource Lifecycle Management

**Question**: How should we prevent memory leaks and ensure all WebGL resources are properly disposed?

**Decision**: **Centralized resource tracking in SceneManager with disposal registry**

**Rationale**:
- **Single Responsibility**: SceneManager owns all Three.js resource lifecycle
- **Automatic Tracking**: All created resources registered in Maps for debugging and disposal
- **Debugging Capability**: Can inspect all active resources at any time
- **Disposal Safety**: Idempotent dispose() method safe to call multiple times
- **React Strict Mode**: Handles double-mounting in development without leaks

**Implementation Pattern**:
```typescript
class SceneManager {
  private materials = new Map<string, THREE.Material>();
  private geometries = new Map<string, THREE.BufferGeometry>();
  
  addMaterial(name: string, material: THREE.Material) {
    this.materials.set(name, material);
  }
  
  dispose() {
    // Idempotent disposal
    this.materials.forEach(m => m.dispose());
    this.geometries.forEach(g => g.dispose());
    this.materials.clear();
    this.geometries.clear();
  }
}
```

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Individual Component Cleanup | Current problem - scattered cleanup logic, easy to miss resources |
| WeakMap Tracking | Insufficient control over disposal timing, debugging difficulty |
| Global Resource Manager | Too broad scope, unclear ownership, complicates testing |

**References**:
- REFACTORING_GUIDE.md Phase 1.1 (SceneManager)
- Three.js manual: "How to dispose of objects"

---

### 3. State Management Without External Libraries

**Question**: What state management pattern should handle galaxy visualization state without adding external dependencies?

**Decision**: **Observer pattern with subscription-based notifications**

**Rationale**:
- **Lightweight**: No external dependencies, ~100 LOC implementation
- **Predictable**: Clear subscription → notification flow
- **Performance**: Targeted updates, only subscribed managers notified
- **Type Safety**: TypeScript interfaces enforce state shape
- **Debuggability**: Easy to trace state changes and listeners

**Implementation Pattern**:
```typescript
class GalaxyStateManager {
  private state: GalaxyState;
  private listeners = new Set<(state: GalaxyState) => void>();
  
  subscribe(listener: (state: GalaxyState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  updateState(updates: Partial<GalaxyState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Zustand | Adds dependency, over-engineered for this scope, learning curve for team |
| Redux | Excessive boilerplate, action/reducer ceremony unnecessary, too heavy |
| React Context | Re-render performance issues at 60fps, difficult to optimize |
| Event Emitter | Less type-safe, unclear state shape, harder to debug |

**References**:
- REFACTORING_GUIDE.md Phase 2.1 (GalaxyStateManager)
- Observer pattern (Gang of Four design patterns)

---

### 4. Side-by-Side Migration Strategy

**Question**: How should we transition from the monolithic component to the new modular system while maintaining a working application?

**Decision**: **Implement managers incrementally, wrap existing code, gradually migrate features**

**Rationale**:
- **Risk Reduction**: Working application maintained throughout refactoring
- **Gradual Validation**: Each manager validated independently before next migration
- **Rollback Capability**: Can pause or adjust approach at any manager boundary
- **Team Confidence**: Small, verifiable steps build confidence in new architecture
- **Production Safety**: No big-bang deployment risk

**Migration Order** (from clarification session):
1. **Week 1**: GalaxyStateManager (foundation for coordination)
2. **Week 1-2**: SceneManager (resource management baseline)
3. **Week 2**: AnimationManager (coordination layer)
4. **Week 2**: InteractionManager (input handling isolation)
5. **Week 3**: ParameterManager (visual parameter coordination)
6. **Week 3**: UIManager (panel lifecycle management)

**Implementation Strategy**:
- Create manager alongside existing code
- Gradually delegate functionality from GalaxyCanvas to manager
- Test each delegation step
- Remove old code only after manager fully validated
- Manual rollback if issues detected (per clarification)

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Big Bang Rewrite | Too risky - 544 lines replaced at once, high chance of regressions |
| Feature Flag Toggle | Over-engineered for internal refactoring, duplicate code maintenance burden |
| Branch-based Development | Merge conflicts accumulate, integration risk grows over 3 weeks |

**References**:
- Clarification Session 2025-10-01 (Q1 answer)
- REFACTORING_GUIDE.md Phase 4 (Migration Strategy)
- Martin Fowler: "Strangler Fig Application" pattern

---

### 5. Animation Loop Coordination

**Question**: How should we coordinate all frame-based updates to prevent performance issues from multiple RAF loops?

**Decision**: **Single requestAnimationFrame loop with callback registration system**

**Rationale**:
- **Performance**: One RAF per frame prevents loop competition
- **Synchronization**: All updates happen in same frame, consistent timing
- **Flexibility**: Managers can register/unregister callbacks dynamically
- **Debugging**: Single entry point for frame profiling
- **Control**: Easy to pause/resume entire animation system

**Implementation Pattern**:
```typescript
class AnimationManager {
  private frameCallbacks = new Set<(deltaTime: number) => void>();
  private animationId: number | null = null;
  
  start() {
    const animate = (time: number) => {
      const deltaTime = calculateDelta(time);
      this.frameCallbacks.forEach(callback => callback(deltaTime));
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }
  
  addFrameCallback(callback: (deltaTime: number) => void): () => void {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }
}
```

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Multiple RAF Loops | Performance issues - loops compete, uncoordinated timing |
| External Animation Library (GSAP for loop) | GSAP optimized for tweens, not general animation loop |
| setInterval/setTimeout | Inconsistent timing, not synchronized with browser rendering |
| Web Animations API | Limited to CSS properties, doesn't handle Three.js updates |

**References**:
- REFACTORING_GUIDE.md Phase 1.3 (AnimationManager)
- MDN: requestAnimationFrame best practices
- Three.js animation loop patterns

---

### 6. TypeScript Patterns for Manager Classes

**Question**: What TypeScript patterns ensure type safety and clear contracts for manager classes?

**Decision**: **Strict interfaces for public APIs, private implementation details, explicit dispose methods**

**Rationale**:
- **Contract Clarity**: Interfaces document public API separate from implementation
- **Encapsulation**: Private fields prevent external mutation
- **Type Safety**: Explicit return types and parameter types prevent errors
- **Consistency**: All managers follow same lifecycle pattern
- **Documentation**: Interface serves as API documentation

**Pattern Template**:
```typescript
// Public interface
export interface ISceneManager {
  getRenderer(): THREE.WebGLRenderer;
  getScene(): THREE.Scene;
  getCamera(): THREE.PerspectiveCamera;
  addMaterial(name: string, material: THREE.Material): void;
  dispose(): void;
}

// Implementation
export class SceneManager implements ISceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private materials: Map<string, THREE.Material>;
  
  constructor(container: HTMLElement) {
    // Private initialization
  }
  
  // Public methods implementing interface
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
  
  public dispose(): void {
    // Idempotent cleanup
  }
}
```

**Type Safety Rules**:
- All public methods have explicit return types
- All parameters have explicit types (no implicit any)
- Generic types used where appropriate (Map<string, Material>)
- Readonly where mutation not intended
- Strict null checks enabled

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Public Members | Breaks encapsulation, allows external mutation, unclear contracts |
| Functional Approach | Resource cleanup complexity, shared state problematic |
| Type Aliases Only | Less strict than interfaces, no implementation validation |

**References**:
- Project Constitution: Type Safety & Quality principle
- TypeScript Handbook: Classes and Interfaces
- Clean Code: Chapter on encapsulation

---

## Technology Stack Decisions

### Core Technologies (Preserved)
- **React 19**: Modern hooks for manager lifecycle
- **Next.js 15**: App Router structure preserved
- **TypeScript 5**: Strict mode enforced
- **Three.js r150+**: WebGL rendering (no changes)
- **GSAP**: Camera animations and parameter transitions
- **lil-gui**: Debug controls (preserved)

### New Internal Dependencies
- **None**: All refactoring uses existing dependencies

### Development Tools (Preserved)
- **Turbopack**: Development server (no changes)
- **ESLint**: Code quality (extended to new modules)
- **Jest**: Testing framework (no new tests per user request)

---

## Performance Considerations

### Memory Impact
- **Manager Objects**: ~5MB total (7 managers × ~0.7MB average)
- **State Storage**: ~1MB (GalaxyState structure)
- **Total Overhead**: < 10MB additional memory
- **Within Budget**: 500MB limit maintained

### Initialization Overhead
- **Manager Creation**: ~20ms (parallel construction)
- **Hook Setup**: ~5ms (React mounting)
- **State Initialization**: ~2ms
- **Total Overhead**: ~27ms (well under 100ms constraint)

### Runtime Performance
- **State Updates**: O(n) where n = listener count (~5-7)
- **Animation Callbacks**: O(m) where m = callback count (~3-5)
- **Frame Budget Impact**: < 1ms per frame
- **60fps Maintained**: Frame budget impact negligible

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation | Residual Risk |
|------|-----------|---------------|
| Memory leaks during migration | Centralized disposal tracking, manual testing | Low |
| Performance regression | Frame time monitoring, side-by-side comparison | Low |
| State synchronization bugs | Type-safe state updates, atomic operations | Medium |
| React strict mode issues | Idempotent initialization, cleanup testing | Low |

### Migration Risks

| Risk | Mitigation | Residual Risk |
|------|-----------|---------------|
| Breaking existing functionality | Incremental migration, manual validation each step | Low |
| 3-week timeline pressure | Weekly milestones, prioritized manager order | Medium |
| Manual rollback complexity | Clear manager boundaries, git workflow discipline | Medium |

---

## Success Metrics

### Code Quality Metrics
- **Cyclomatic Complexity**: Target < 10 per module (from 50+)
- **File Length**: Max 300 lines per module
- **Type Coverage**: 100% explicit types
- **ESLint**: Zero warnings

### Performance Metrics
- **Frame Rate**: 60fps maintained
- **Memory**: < 500MB extended sessions
- **Initialization**: < 100ms overhead
- **Hot Reload**: < 1s refresh time

---

## Conclusion

All research questions resolved with clear technical decisions. Architecture pattern selected (class-based managers with React hooks) provides optimal balance of encapsulation, testability, and performance. Side-by-Side Migration strategy minimizes risk while allowing gradual validation. GalaxyStateManager-first approach establishes coordination foundation before dependent managers.

**Status**: ✅ Ready for Phase 1 (Design & Contracts)

