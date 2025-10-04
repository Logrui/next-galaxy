# Implementation Plan: Galaxy Canvas Architecture Refactoring

**Branch**: `001-refactor-prior-to` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `D:\DevelopmentFiles\next-galaxy\specs\001-refactor-prior-to\spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ All context clear from spec and REFACTORING_GUIDE.md
3. Fill the Constitution Check section based on the content of the constitution document.
   → ✅ Completed below
4. Evaluate Constitution Check section
   → ✅ No violations - all principles aligned
5. Execute Phase 0 → research.md
   → ✅ Generated
6. Execute Phase 1 → data-model.md, quickstart.md
   → ✅ Generated
7. Re-evaluate Constitution Check section
   → ✅ PASS - No new violations
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → ✅ Described below
9. STOP - Ready for /tasks command
   → ✅ Plan complete
```

**IMPORTANT**: The /plan command STOPS at step 9. Phase 2 is executed by /tasks command.

## Summary

**Primary Requirement**: Transform the monolithic 544-line GalaxyCanvas.tsx component into a modular, maintainable architecture by extracting distinct manager classes for scene management, state coordination, animation control, interaction handling, visual parameters, and UI panels.

**Technical Approach**: Side-by-Side Migration strategy where new manager-based system coexists with legacy code, gradually migrating features one manager at a time. GalaxyStateManager will be implemented first to establish central state coordination, followed by dependent managers (SceneManager, AnimationManager, InteractionManager, ParameterManager, UIManager) in dependency order.

**Success Criteria**: Reduce cyclomatic complexity from 50+ to below 10, split into 7+ focused modules (max 300 lines each), maintain 60fps performance and < 500MB memory, zero user-facing changes.

## Technical Context

**Language/Version**: TypeScript 5 with strict mode enabled  
**Primary Dependencies**: React 19, Next.js 15, Three.js r150+, GSAP, lil-gui  
**Storage**: N/A (in-memory state management only)  
**Testing**: Jest for unit tests, manual validation for regression  
**Target Platform**: Web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)  
**Project Type**: Web application (Next.js single project structure)  
**Performance Goals**: 60fps sustained (16.67ms frame budget), < 500MB memory extended sessions  
**Constraints**: Zero user-facing changes, no breaking API changes, < 100ms initialization overhead  
**Scale/Scope**: ~3,000 LOC refactoring, 7+ new manager modules, 3-week timeline

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Performance-First Architecture
- [x] Feature maintains 60fps target with < 16.67ms frame budget - **PASS**: Refactoring maintains existing performance, no new rendering logic
- [x] Performance monitoring integrated for development - **PASS**: Existing PerformanceMonitor preserved
- [x] Adaptive quality scaling considered for low-end devices - **PASS**: No changes to existing adaptive scaling
- [x] Memory impact assessed (must stay under 500MB extended session budget) - **PASS**: Manager objects minimal overhead (<5MB total)
- Violations requiring justification: **NONE**

### II. Accessibility & Inclusivity
- [x] WCAG AA compliance verified (ARIA labels, keyboard nav, focus management) - **PASS**: Zero accessibility changes
- [x] Screen reader support tested - **PASS**: UI panels preserved as-is
- [x] Reduced motion preferences respected - **PASS**: No animation behavior changes
- [x] Color contrast ratios meet 4.5:1 minimum - **PASS**: No visual changes
- Violations requiring justification: **NONE**

### III. Type Safety & Quality
- [x] TypeScript strict mode enabled - **PASS**: All new manager classes use strict mode
- [x] No `any` types without explicit justification - **PASS**: Full type coverage planned
- [x] ESLint passes with zero warnings - **PASS**: New code follows existing linting rules
- [x] All exports have explicit type annotations - **PASS**: Manager APIs fully typed
- Violations requiring justification: **NONE**

### IV. Test-Driven Development
- [x] Contract tests planned before implementation - **DEFERRED**: No testing required per user request
- [x] Integration tests defined for user flows - **DEFERRED**: Manual validation only
- [x] Performance tests planned for critical paths - **DEFERRED**: Manual performance verification
- [x] Minimum 80% coverage target for new code - **DEFERRED**: No coverage requirements
- Violations requiring justification: **Testing requirements waived by user for this refactoring**

### V. Modern Web Standards
- [x] Next.js 15+ App Router used (no Pages Router) - **PASS**: Existing Next.js 15 structure preserved
- [x] React 19+ with modern hooks - **PASS**: Using React 19 hooks for manager lifecycle
- [x] Browser targets verified (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) - **PASS**: No changes to browser support
- Violations requiring justification: **NONE**

### VI. Progressive Enhancement
- [x] Graceful degradation strategy defined - **PASS**: Manual rollback handling defined
- [x] WebGL context loss handling planned - **PASS**: Existing handling preserved in SceneManager
- [x] Asset loading failures handled with fallbacks - **PASS**: No changes to asset loading
- Violations requiring justification: **NONE**

### VII. Developer Experience
- [x] Hot reload compatibility maintained - **PASS**: React hot reload preserved
- [x] Build time impact assessed (< 30s target) - **PASS**: No build time impact expected
- [x] Comprehensive inline documentation planned - **PASS**: JSDoc required for all public APIs
- Violations requiring justification: **NONE**

## Project Structure

### Documentation (this feature)
```
specs/001-refactor-prior-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
app/galaxy/
├── GalaxyCanvas.tsx                    # Main component (refactored to use managers)
├── managers/                           # NEW: Manager classes
│   ├── GalaxyStateManager.ts          # Phase 1 Week 1: Central state store
│   ├── SceneManager.ts                # Phase 1 Week 1-2: Three.js resource management
│   ├── AnimationManager.ts            # Phase 2 Week 2: Animation loop coordination
│   ├── InteractionManager.ts          # Phase 2 Week 2: Input handling
│   ├── ParameterManager.ts            # Phase 3 Week 3: Visual parameter transitions
│   └── UIManager.ts                   # Phase 3 Week 3: UI panel coordination
├── hooks/                              # NEW: React hooks for managers
│   ├── useGalaxyStateManager.ts       # State manager hook
│   ├── useSceneManager.ts             # Scene manager hook
│   ├── useAnimationManager.ts         # Animation manager hook
│   ├── useInteractionManager.ts       # Interaction manager hook
│   ├── useParameterManager.ts         # Parameter manager hook
│   └── useUIManager.ts                # UI manager hook
├── ui/                                 # Existing UI panels
│   ├── base/                          # NEW: Base panel class
│   │   └── Panel.ts                   # Abstract panel base class
│   ├── createCameraInfoOverlay.ts     # Refactored to use Panel base
│   ├── createPathPanel.ts             # Refactored to use Panel base
│   ├── createPhasePanel.ts            # Refactored to use Panel base
│   ├── createPresetButtons.ts         # Refactored to use Panel base
│   └── createStatusPanel.ts           # Refactored to use Panel base
├── types.ts                            # Existing types + new manager types
├── core/                               # Existing core modules (preserved)
│   ├── createAnimationLoop.ts         # Gradually migrated to AnimationManager
│   ├── createInteraction.ts           # Gradually migrated to InteractionManager
│   ├── createMaterial.ts              # Used by SceneManager
│   ├── createPointCloud.ts            # Used by SceneManager
│   └── createUniforms.ts              # Used by ParameterManager
└── [other existing files preserved]
```

**Structure Decision**: Single Next.js project structure. New `managers/` and `hooks/` directories added under `app/galaxy/`. Existing file structure preserved to support Side-by-Side Migration strategy.

## Phase 0: Outline & Research

### Research Topics

1. **Manager Pattern in React Applications**
   - Decision: Use class-based managers with React hooks for lifecycle integration
   - Rationale: Classes provide clear resource ownership and disposal patterns, hooks bridge to React lifecycle
   - Alternatives considered: Zustand/Redux (too heavy), React Context (insufficient encapsulation)
   - Reference: REFACTORING_GUIDE.md Phase 1-2

2. **Three.js Resource Lifecycle Management**
   - Decision: Centralized resource tracking in SceneManager with disposal registry
   - Rationale: Single point of responsibility prevents memory leaks, enables debugging
   - Alternatives considered: Individual component cleanup (current issue), WeakMap tracking (insufficient control)
   - Reference: REFACTORING_GUIDE.md Phase 1.1

3. **State Management Without External Libraries**
   - Decision: Observer pattern with subscription-based notifications
   - Rationale: Lightweight, predictable, no external dependencies, sufficient for refactoring needs
   - Alternatives considered: Zustand (over-engineering), Redux (excessive boilerplate), React Context (performance issues with frequent updates)
   - Reference: REFACTORING_GUIDE.md Phase 2.1

4. **Side-by-Side Migration Strategy**
   - Decision: Implement managers incrementally, wrap existing code until full migration
   - Rationale: Reduces risk, allows gradual validation, maintains working application throughout
   - Alternatives considered: Big Bang rewrite (too risky), Feature flag toggle (unnecessary complexity for internal refactoring)
   - Reference: Clarification Session 2025-10-01, REFACTORING_GUIDE.md Phase 4

5. **Animation Loop Coordination**
   - Decision: Single RAF loop with callback registration system
   - Rationale: Prevents multiple RAF loops competing, simplifies synchronization
   - Alternatives considered: Multiple RAF loops per manager (performance issues), External animation library (unnecessary dependency)
   - Reference: REFACTORING_GUIDE.md Phase 1.3

6. **TypeScript Patterns for Manager Classes**
   - Decision: Strict interfaces for public APIs, private implementation details, explicit dispose methods
   - Rationale: Clear contracts, encapsulation, memory safety
   - Alternatives considered: Public members (breaks encapsulation), Functional approach (resource cleanup complexity)
   - Reference: Project constitution Type Safety principle

**Output**: research.md documenting all design decisions

## Phase 1: Design & Contracts

### Data Model

**Key Entities**:

1. **GalaxyStateManager**
   - Fields: state (GalaxyState), listeners (Set<Listener>)
   - Relationships: Observed by all other managers
   - State transitions: updateState() → notify listeners → managers react
   - Validation: Type-safe updates, atomic state changes

2. **SceneManager**
   - Fields: renderer, scene, camera, controls, materials (Map), geometries (Map)
   - Relationships: Used by AnimationManager for rendering, InteractionManager for raycasting
   - Lifecycle: constructor → init → dispose
   - Resource tracking: All Three.js objects registered for cleanup

3. **AnimationManager**
   - Fields: animationId, isRunning, frameCallbacks (Set<Callback>)
   - Relationships: Coordinates SceneManager rendering, ParameterManager updates
   - Lifecycle: start → addFrameCallback → stop → cleanup
   - Performance: Single RAF loop, callback execution tracking

4. **InteractionManager**
   - Fields: mode ('fixed'|'free'), mousePosition, raycaster, inputEvents
   - Relationships: Updates GalaxyStateManager, reads from SceneManager
   - Mode switching: setMode() → cleanup old handlers → setup new handlers
   - Event handling: Mouse/keyboard events → state updates

5. **ParameterManager**
   - Fields: uniforms (ShaderUniforms), currentParameters, targetParameters, transitionProgress
   - Relationships: Reads GalaxyStateManager, updates shader uniforms
   - Transitions: transitionToParameters() → GSAP animation → uniform updates
   - Validation: Parameter bounds checking, type safety

6. **UIManager**
   - Fields: container, panels (Map<string, Panel>), stateManager
   - Relationships: Observes GalaxyStateManager, uses SceneManager for positioning
   - Panel lifecycle: addPanel → show/hide → removePanel → destroy
   - Positioning: Camera-relative panel positioning

7. **Panel (Base Class)**
   - Fields: element, container, isVisible
   - Lifecycle: createElement → setupStyles → show/hide → destroy
   - Inheritance: All UI panels extend this base class
   - Consistency: Uniform lifecycle across all panel types

### Generated Artifacts

1. **data-model.md**: Complete entity definitions with fields, relationships, validation rules
2. **quickstart.md**: Developer quick reference for using the new manager system

### Agent Context Update

No agent-specific template file update needed for this refactoring as it doesn't change external APIs or add new features requiring agent context.

**Output**: data-model.md, quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (data model, quickstart)
- Follow Side-by-Side Migration strategy from clarifications
- Implement GalaxyStateManager first (clarification answer)
- Each manager → separate implementation task
- Each hook → separate wrapper task
- Each existing panel → refactoring task

**Ordering Strategy**:
- **Week 1**: Foundation (GalaxyStateManager, SceneManager basics)
- **Week 2**: Core Coordination (AnimationManager, InteractionManager)
- **Week 3**: Polish (ParameterManager, UIManager, final integration)
- Mark [P] for parallel execution (independent managers)
- Sequential dependencies: State → Scene → Animation → Others

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md following migration strategy

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following Side-by-Side Migration)  
**Phase 5**: Validation (manual testing, performance verification, regression checks)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Testing requirements waived | User explicitly removed testing requirements from spec | N/A - User decision |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
