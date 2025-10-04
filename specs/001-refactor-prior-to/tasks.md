# Tasks: Galaxy Canvas Architecture Refactoring

**Input**: Design documents from `D:\DevelopmentFiles\next-galaxy\specs\001-refactor-prior-to\`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Loaded: Side-by-Side Migration, GalaxyStateManager first
2. Load optional design documents:
   → ✅ data-model.md: 9 entities extracted
   → ✅ research.md: 6 technical decisions extracted
   → ✅ quickstart.md: Developer patterns extracted
3. Generate tasks by category:
   → ✅ Setup: Directory structure, types
   → ✅ Core: 7 managers (Week 1-3)
   → ✅ Hooks: 6 React hooks
   → ✅ UI: Panel base + 5 panel refactorings
   → ✅ Integration: GalaxyCanvas refactoring
   → ✅ Polish: Documentation, validation
4. Apply task rules:
   → ✅ Different files = [P]
   → ✅ Same file modifications = sequential
   → ✅ Dependencies enforced
5. Number tasks sequentially (T001-T036)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ All 9 entities have implementation tasks
   → ✅ Dependency order validated
   → ✅ Migration strategy aligned
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Tasks ordered by Side-by-Side Migration strategy

## Path Conventions
Single Next.js project structure:
- `app/galaxy/` - Main galaxy code
- `app/galaxy/managers/` - NEW: Manager classes
- `app/galaxy/hooks/` - NEW: React hooks
- `app/galaxy/ui/base/` - NEW: Panel base class

---

## Week 1: Foundation (GalaxyStateManager + SceneManager)

### Phase 3.1: Setup & Structure
**Goal**: Create new directory structure and type definitions

- [x] **T001** [P] Create `app/galaxy/managers/` directory for manager classes
- [x] **T002** [P] Create `app/galaxy/hooks/` directory for React hooks
- [x] **T003** [P] Create `app/galaxy/ui/base/` directory for Panel base class
- [x] **T004** [P] Update `app/galaxy/types.ts` with manager interfaces and GalaxyState type definitions

**Parallel Execution**: T001-T004 can run simultaneously (different directories)

---

### Phase 3.2: Week 1 Core - State Foundation
**Goal**: Implement GalaxyStateManager first (clarification priority)

- [x] **T005** Implement GalaxyStateManager in `app/galaxy/managers/GalaxyStateManager.ts`
  - Observer pattern with subscription system
  - GalaxyState interface (cameraPosition, cameraTarget, interactionMode, visualParameters, uiPanels, isInitialized, loadingProgress)
  - Methods: getState(), updateState(), subscribe(), setInteractionMode(), updateVisualParameters()
  - Type-safe with TypeScript strict mode
  - Atomic state updates
  - **Reference**: data-model.md Section 1

- [x] **T006** Create useGalaxyStateManager hook in `app/galaxy/hooks/useGalaxyStateManager.ts`
  - Initialize GalaxyStateManager on mount
  - Cleanup (dispose) on unmount
  - Return manager instance
  - **Reference**: quickstart.md "Creating Custom Managers" section

---

### Phase 3.3: Week 1 Core - Scene Management
**Goal**: Implement SceneManager for Three.js resource lifecycle

- [x] **T007** Implement SceneManager in `app/galaxy/managers/SceneManager.ts`
  - Constructor accepts HTMLElement container
  - Initialize renderer, scene, camera, controls
  - Resource tracking Maps: materials, geometries
  - Methods: getRenderer(), getScene(), getCamera(), getControls(), addMaterial(), addGeometry(), resize(), dispose()
  - Idempotent disposal (safe to call multiple times)
  - **Reference**: data-model.md Section 2, research.md Topic 2

- [x] **T008** Create useSceneManager hook in `app/galaxy/hooks/useSceneManager.ts`
  - Accepts containerRef and stateManager
  - Initialize SceneManager when container available
  - Handle resize events
  - Cleanup on unmount
  - **Reference**: quickstart.md "Manager Reference" section

---

## Week 2: Coordination (AnimationManager + InteractionManager)

### Phase 3.4: Week 2 Core - Animation Coordination
**Goal**: Centralize animation loop to prevent multiple RAF loops

- [x] **T009** Implement AnimationManager in `app/galaxy/managers/AnimationManager.ts`
  - Single requestAnimationFrame loop
  - Callback registration system: Set<(deltaTime: number) => void>
  - Methods: start(), stop(), pause(), resume(), addFrameCallback(), removeFrameCallback(), isAnimating(), dispose()
  - Delta time calculation with THREE.Clock
  - Try-catch wrapper for callbacks (error resilience)
  - **Reference**: data-model.md Section 3, research.md Topic 5

- [x] **T010** Create useAnimationManager hook in `app/galaxy/hooks/useAnimationManager.ts`
  - Initialize AnimationManager with sceneManager
  - Auto-start animation loop
  - Cleanup (stop, dispose) on unmount
  - **Reference**: quickstart.md "AnimationManager" section

---

### Phase 3.5: Week 2 Core - Interaction Handling
**Goal**: Centralize input handling and support mode switching

- [x] **T011** Implement InteractionManager in `app/galaxy/managers/InteractionManager.ts`
  - Constructor accepts sceneManager, stateManager
  - Mode management: 'fixed' | 'free'
  - Mouse position tracking (normalized -1 to 1)
  - Raycaster for intersection detection
  - Event listener registration/cleanup
  - Methods: setMode(), getMode(), getMousePosition(), getIntersections(), dispose()
  - OrbitControls enable/disable based on mode
  - **Reference**: data-model.md Section 4

- [x] **T012** Create useInteractionManager hook in `app/galaxy/hooks/useInteractionManager.ts`
  - Initialize InteractionManager with sceneManager, stateManager
  - Subscribe to state changes for mode updates
  - Cleanup event listeners on unmount
  - **Reference**: quickstart.md "InteractionManager" section

---

## Week 3: Polish (ParameterManager + UIManager + Integration)

### Phase 3.6: Week 3 Core - Visual Parameters
**Goal**: Manage shader parameters with smooth transitions

- [x] **T013** Implement ParameterManager in `app/galaxy/managers/ParameterManager.ts`
  - Constructor accepts Three.js uniforms, stateManager
  - VisualParameters interface (fdAlpha, focalDistance, aperture, nebulaAmp, phaseMix, dyingMix, pathMode, superScale)
  - Methods: setParameters(), getParameters(), getUniforms(), transitionToParameters() returns Promise
  - GSAP-powered smooth transitions between parameter sets
  - Parameter validation (bounds checking)
  - **Reference**: data-model.md Section 5

- [x] **T014** Create useParameterManager hook in `app/galaxy/hooks/useParameterManager.ts`
  - Initialize ParameterManager with uniforms from sceneManager
  - Subscribe to state changes for visual parameter updates
  - Cleanup on unmount
  - **Reference**: quickstart.md "ParameterManager" section

---

### Phase 3.7: Week 3 Core - UI Panel Management
**Goal**: Centralize UI panel lifecycle and positioning

- [x] **T015** [P] Implement Panel base class in `app/galaxy/ui/base/Panel.ts`
  - Abstract class with protected element, container, isVisible
  - Abstract methods: createElement(), update(data)
  - Concrete methods: show(), hide(), toggle(), isShown(), destroy()
  - Glassmorphism default styles
  - Event listener cleanup in destroy()
  - **Reference**: data-model.md Section 7

- [x] **T016** Implement UIManager in `app/galaxy/managers/UIManager.ts`
  - Constructor accepts container, stateManager, sceneManager
  - Panel registry: Map<string, Panel>
  - Methods: addPanel(), removePanel(), showPanel(), hidePanel(), togglePanel(), updatePanelPositions(), dispose()
  - Subscribe to state for panel visibility sync
  - **Reference**: data-model.md Section 6
  - **Dependency**: Requires T015 (Panel base class)

- [x] **T017** Create useUIManager hook in `app/galaxy/hooks/useUIManager.ts`
  - Initialize UIManager with container, sceneManager, stateManager
  - Cleanup panels on unmount
  - **Reference**: quickstart.md "UIManager" section

---

### Phase 3.8: Week 3 Integration - Panel Refactoring
**Goal**: Refactor existing panels to extend Panel base class

- [x] **T018** [P] Refactor CameraInfoPanel to extend Panel base class in `app/galaxy/ui/createCameraInfoOverlay.ts`
  - Convert to class extending Panel
  - Implement createElement() and update(data) methods
  - Maintain existing glassmorphism styles
  - **Reference**: quickstart.md "Creating Custom UI Panels"

- [x] **T019** [P] Refactor PresetButtonsPanel to extend Panel base class in `app/galaxy/ui/createPresetButtons.ts`
  - Convert to class extending Panel
  - Implement createElement() and update(data) methods
  - Maintain button click handlers
  - **Reference**: quickstart.md "Creating Custom UI Panels"

- [x] **T020** [P] Refactor PhasePanel to extend Panel base class in `app/galaxy/ui/createPhasePanel.ts`
  - Convert to class extending Panel
  - Implement createElement() and update(data) methods
  - **Reference**: quickstart.md "Creating Custom UI Panels"

- [x] **T021** [P] Refactor StatusPanel to extend Panel base class in `app/galaxy/ui/createStatusPanel.ts`
  - Convert to class extending Panel
  - Implement createElement() and update(data) methods
  - **Reference**: quickstart.md "Creating Custom UI Panels"

- [x] **T022** [P] Refactor PathPanel to extend Panel base class in `app/galaxy/ui/createPathPanel.ts`
  - Convert to class extending Panel
  - Implement createElement() and update(data) methods
  - **Reference**: quickstart.md "Creating Custom UI Panels"

**Parallel Execution**: T018-T022 can run simultaneously (different files)

---

### Phase 3.9: Week 3 Integration - GalaxyCanvas Refactoring
**Goal**: Integrate managers into GalaxyCanvas.tsx using Side-by-Side Migration

- [x] **T023** Refactor GalaxyCanvas.tsx to use manager hooks (Part 1: Imports & State)
  - Add all manager and panel imports
  - Initialize GalaxyStateManager via hook
  - Keep existing code working (additive only)
  - Git commit after completion
  - **Reference**: INTEGRATION_GUIDE.md Phase 1
  - **File**: `app/galaxy/GalaxyCanvas.tsx`

- [ ] **T024** Refactor GalaxyCanvas.tsx (Part 2: Scene Management)
  - Replace inline Three.js setup with SceneManager
  - Remove manual resize handler (SceneManager handles it)
  - Update cleanup to use sceneManager.dispose()
  - Git commit after completion
  - **Reference**: INTEGRATION_GUIDE.md Phase 2 Steps 1-4
  - **File**: `app/galaxy/GalaxyCanvas.tsx`
  - **Dependency**: Requires T023

- [ ] **T025** Refactor GalaxyCanvas.tsx (Part 3: Animation & Interaction)
  - Initialize AnimationManager and register frame callbacks
  - Replace createAnimationLoop with AnimationManager callbacks
  - Initialize InteractionManager (replace createInteraction)
  - Git commit after completion
  - **Reference**: INTEGRATION_GUIDE.md Phase 2 Steps 5-8
  - **File**: `app/galaxy/GalaxyCanvas.tsx`
  - **Dependency**: Requires T024

- [ ] **T026** Refactor GalaxyCanvas.tsx (Part 4: Parameters & UI Panels)
  - Initialize ParameterManager
  - Initialize UIManager and migrate all panels
  - Update phase/path animations to use ParameterManager
  - Git commit after completion
  - **Reference**: INTEGRATION_GUIDE.md Phase 2 Steps 9-12
  - **File**: `app/galaxy/GalaxyCanvas.tsx`
  - **Dependency**: Requires T025

- [ ] **T027** Refactor GalaxyCanvas.tsx (Part 5: Cleanup & Validation)
  - Remove redundant refs and manual cleanup logic
  - Verify all features work identically
  - Run ESLint and fix any issues
  - Git commit after completion
  - **Reference**: INTEGRATION_GUIDE.md Phase 3
  - **File**: `app/galaxy/GalaxyCanvas.tsx`
  - **Dependency**: Requires T026

---

## Phase 3.10: Polish & Validation

### Documentation & Types (COMPLETED)

- [x] **T028** [P] Add JSDoc documentation to GalaxyStateManager public methods
  - Document all public methods with @param, @returns, @example
  - **File**: `app/galaxy/managers/GalaxyStateManager.ts`

- [x] **T029** [P] Add JSDoc documentation to SceneManager public methods
  - Document resource lifecycle patterns
  - **File**: `app/galaxy/managers/SceneManager.ts`

- [x] **T030** [P] Add JSDoc documentation to AnimationManager public methods
  - Document frame callback patterns and performance tips
  - **File**: `app/galaxy/managers/AnimationManager.ts`

- [x] **T031** [P] Add JSDoc documentation to InteractionManager public methods
  - Document mode switching behavior
  - **File**: `app/galaxy/managers/InteractionManager.ts`

- [x] **T032** [P] Add JSDoc documentation to ParameterManager public methods
  - Document transition promises and parameter bounds
  - **File**: `app/galaxy/managers/ParameterManager.ts`

- [x] **T033** [P] Add JSDoc documentation to UIManager public methods
  - Document panel lifecycle
  - **File**: `app/galaxy/managers/UIManager.ts`

**Parallel Execution**: T028-T033 can run simultaneously (different files)

---

### Quality & Validation (COMPLETED)

- [x] **T034** TypeScript strict mode verification across all new modules
  - Verify no `any` types without explicit justification
  - Check all exports have explicit type annotations
  - Ensure 100% type coverage
  - **Files**: All `app/galaxy/managers/*.ts` and `app/galaxy/hooks/*.ts`
  - **Reference**: Constitution Principle III

- [x] **T035** ESLint verification for all new modules
  - Run ESLint on managers/, hooks/, ui/base/
  - Fix all warnings (target: zero warnings)
  - **Files**: `app/galaxy/managers/`, `app/galaxy/hooks/`, `app/galaxy/ui/base/`
  - **Reference**: Constitution Principle III

- [ ] **T036** Performance validation (Post-Integration)
  - Manual frame rate testing (verify 60fps maintained)
  - Memory profiling (verify < 500MB extended sessions)
  - Check initialization overhead (< 100ms)
  - Animation callback execution time monitoring (< 10ms per frame)
  - **Reference**: Constitution Principle I, VALIDATION_CHECKLIST.md
  - **Dependency**: Requires T027

- [ ] **T037** Final manual validation checklist (Post-Integration)
  - All existing features work identically (zero user-facing changes)
  - Hot reload works correctly
  - React strict mode (double-mounting) handled properly
  - Resource cleanup verified (no memory leaks on unmount/remount)
  - Mode switching (fixed/free) works seamlessly
  - Visual parameter transitions are smooth
  - UI panels show/hide correctly
  - **Reference**: spec.md Acceptance Scenarios, VALIDATION_CHECKLIST.md
  - **Dependency**: Requires T036

---

## Dependencies

### Week 1 Dependencies (Foundation)
```
T001-T004 (Setup) → No dependencies, can run in parallel
    ↓
T005 (GalaxyStateManager) → Requires T004 (types)
    ↓
T006 (useGalaxyStateManager hook) → Requires T005
    ↓
T007 (SceneManager) → Requires T004 (types)
    ↓
T008 (useSceneManager hook) → Requires T007
```

### Week 2 Dependencies (Coordination)
```
T009 (AnimationManager) → Requires T007 (SceneManager)
    ↓
T010 (useAnimationManager hook) → Requires T009
    ↓
T011 (InteractionManager) → Requires T005 (State), T007 (Scene)
    ↓
T012 (useInteractionManager hook) → Requires T011
```

### Week 3 Dependencies (Polish & Integration)
```
T013 (ParameterManager) → Requires T005 (State), T007 (Scene)
    ↓
T014 (useParameterManager hook) → Requires T013
    ↓
T015 (Panel base class) → Requires T004 (types)
    ↓
T016 (UIManager) → Requires T015 (Panel), T005 (State), T007 (Scene)
    ↓
T017 (useUIManager hook) → Requires T016
    ↓
T018-T022 (Panel refactoring) → Requires T015 (Panel base) - can run in parallel
    ↓
T023 (GalaxyCanvas Part 1) → Requires T006, T008
    ↓
T024 (GalaxyCanvas Part 2) → Requires T023, T010, T012
    ↓
T025 (GalaxyCanvas Part 3) → Requires T024, T014, T017
    ↓
T026 (Remove legacy code) → Requires T025
    ↓
T027-T032 (Documentation) → Requires respective manager implementations - can run in parallel
    ↓
T033-T036 (Validation) → Requires all above
```

---

## Parallel Execution Examples

### Week 1: Setup Phase
```bash
# Run T001-T004 simultaneously (different directories)
Task: "Create app/galaxy/managers/ directory"
Task: "Create app/galaxy/hooks/ directory"
Task: "Create app/galaxy/ui/base/ directory"
Task: "Update app/galaxy/types.ts with manager interfaces"
```

### Week 3: Panel Refactoring
```bash
# Run T018-T022 simultaneously (different files)
Task: "Refactor CameraInfoPanel to extend Panel base in app/galaxy/ui/createCameraInfoOverlay.ts"
Task: "Refactor PresetButtonsPanel to extend Panel base in app/galaxy/ui/createPresetButtons.ts"
Task: "Refactor PhasePanel to extend Panel base in app/galaxy/ui/createPhasePanel.ts"
Task: "Refactor StatusPanel to extend Panel base in app/galaxy/ui/createStatusPanel.ts"
Task: "Refactor PathPanel to extend Panel base in app/galaxy/ui/createPathPanel.ts"
```

### Polish Phase: Documentation
```bash
# Run T027-T032 simultaneously (different files)
Task: "Add JSDoc to GalaxyStateManager in app/galaxy/managers/GalaxyStateManager.ts"
Task: "Add JSDoc to SceneManager in app/galaxy/managers/SceneManager.ts"
Task: "Add JSDoc to AnimationManager in app/galaxy/managers/AnimationManager.ts"
Task: "Add JSDoc to InteractionManager in app/galaxy/managers/InteractionManager.ts"
Task: "Add JSDoc to ParameterManager in app/galaxy/managers/ParameterManager.ts"
Task: "Add JSDoc to UIManager in app/galaxy/managers/UIManager.ts"
```

---

## Notes

### Execution Guidelines
- **[P] tasks**: Different files, no dependencies, safe to parallelize
- **Sequential tasks**: Modifying same file (GalaxyCanvas.tsx T023-T026)
- **Commit strategy**: Commit after each major task or logical group
- **Side-by-Side Migration**: Keep old code working until new managers validated

### Key Constraints
- **Zero user-facing changes**: All refactoring is internal
- **Performance**: Maintain 60fps, verify after each week
- **Memory**: Stay under 500MB, check after integration
- **Hot reload**: Must work correctly throughout refactoring
- **Type safety**: TypeScript strict mode, no `any` types

### Validation Checkpoints
- **End of Week 1**: State + Scene managers working, GalaxyCanvas partially integrated
- **End of Week 2**: Animation + Interaction working, full coordination
- **End of Week 3**: All managers integrated, panels refactored, validation complete

### Risk Mitigation
- **Side-by-Side approach**: Old code remains functional during migration
- **Incremental validation**: Test each manager before proceeding
- **Manual rollback**: Git commits allow reverting any problematic changes
- **Weekly milestones**: Clear go/no-go decisions at end of each week

---

## Task Generation Rules Applied

1. **From Data Model**: ✅
   - 9 entities → 9 manager/hook implementation tasks (T005-T017)
   - Relationships → dependency ordering enforced

2. **From Research Decisions**: ✅
   - Manager pattern → class-based implementation approach
   - Side-by-Side Migration → incremental integration strategy (T023-T026)
   - Resource tracking → SceneManager registry pattern

3. **From Clarifications**: ✅
   - GalaxyStateManager first (T005 Week 1)
   - Side-by-Side Migration (Tasks grouped by week)
   - Manual rollback (noted in Risk Mitigation)

4. **Ordering Rules**: ✅
   - Setup (T001-T004) → Core (T005-T017) → Integration (T018-T026) → Polish (T027-T036)
   - Dependencies block parallel execution (explicit dependency graph)
   - State before Scene before Animation before others

---

## Validation Checklist

- [x] All entities have implementation tasks (9 managers + hooks)
- [x] All tasks ordered by dependencies
- [x] Parallel tasks truly independent ([P] markers verified)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Side-by-Side Migration strategy followed
- [x] GalaxyStateManager implemented first (clarification answer)
- [x] Three-week structure maintained
- [x] Constitutional principles referenced

**Total Tasks**: 36  
**Estimated Duration**: 3 weeks (12 tasks/week average)  
**Parallelizable Tasks**: 15 ([P] markers)

---

**STATUS**: ✅ Ready for implementation via `/implement` command or manual execution

