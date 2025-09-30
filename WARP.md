# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Framework: Next.js 15 (App Router) with Turbopack
- Language: TypeScript
- UI/Styling: Tailwind CSS
- 3D/Graphics: Three.js, GLSL shaders; animations via GSAP
- Tests: Jest (unit/integration/contract/performance) and Playwright (e2e)
- Dev/Prod port: 9999

Common commands
- Install dependencies
  ```powershell path=null start=null
  npm install
  ```
- Development server (Turbopack)
  ```powershell path=null start=null
  npm run dev
  # Opens http://localhost:9999
  ```
- Production build and start
  ```powershell path=null start=null
  npm run build
  npm run start
  ```
- Lint (entire repo or a single path)
  ```powershell path=null start=null
  # Entire repo
  npm run lint -- .

  # Single file or directory
  npm run lint -- app/galaxy/GalaxyCanvas.tsx
  npm run lint -- app/

  # With auto-fix for current directory
  npm run lint -- --fix .
  ```
- Jest unit/integration/etc.
  ```powershell path=null start=null
  # Full test suite
  npm test

  # Watch mode
  npm run test:watch

  # CI mode with coverage
  npm run test:ci

  # Run a single test file
  npm test -- tests/unit/loading-components.test.tsx

  # Filter by test name (regex)
  npm test -- -t "LoadingScreen"
  ```
- Playwright e2e
  ```powershell path=null start=null
  # Full e2e suite (builds and starts the app on port 9999)
  npm run test:e2e

  # Single spec
  npm run test:e2e -- tests/e2e/loading-sequence.spec.ts

  # Single browser project (e.g., chromium)
  npm run test:e2e -- --project=chromium tests/e2e/loading-sequence.spec.ts

  # Filter by test title
  npm run test:e2e -- -g "webgl"
  ```

Testing layout and configuration
- Unit/integration/contract/performance tests live under tests/** and app/** according to:
  - Jest config: jest.config.js
    - testMatch includes:
      - <rootDir>/tests/**/*.test.{js,jsx,ts,tsx}
      - <rootDir>/app/**/*.test.{js,jsx,ts,tsx}
    - setupFilesAfterEnv: jest.setup.js
    - environment: jest-environment-jsdom
    - moduleNameMapper includes alias ^@/(.*)$ -> <rootDir>/$1
    - transformIgnorePatterns: node_modules/(?!(three|gsap)/)
    - collectCoverageFrom: app/**/*.{js,jsx,ts,tsx}
  - E2E: Playwright config at playwright.config.ts
    - testDir: ./tests/e2e
    - baseURL: http://localhost:9999
    - webServer: npm run build && npm start (reuses existing server locally)
    - projects for chromium, firefox, webkit; reporter: html

High-level architecture
- App Router structure (app/)
  - app/layout.tsx and app/page.tsx set up the overall shell and root page
  - app/globals.css contains global styles (Tailwind configured via tailwind.config.js and postcss.config.js)
- Galaxy visualization subsystem (app/galaxy/)
  - GalaxyCanvas.tsx: Orchestrates the Three.js scene and lifecycle
  - ParticleSystem.ts: Encapsulates particle cloud logic
  - core/: Composable factory/util modules that assemble the scene
    - createAnimationLoop.ts: Frame loop and render/update orchestration
    - createInteraction.ts: Pointer/mouse/touch interactions
    - createMaterial.ts, createPointCloud.ts, createUniforms.ts: Materials, point cloud geometry, and GLSL uniforms wiring
    - createDebugGUI.ts: Optional developer UI hooks for debugging/inspection
  - presets/: Parameterized scene presets (galaxy, nebula, dyingStar) and index.ts to expose them
  - shaders.ts and shaders/*.glsl.ts: Shader phases and custom GLSL paths for visual effects
  - ui/: Programmatic UI overlays (camera info, phase/preset panels)
  - location_presets.ts: Named camera viewpoints and descriptions
  - types.ts: Local type definitions for the galaxy domain
- Loading and UX components (app/components/ and app/components/loading/)
  - LoadingScreen.tsx and supporting modules (AccessibilityEnhancer.tsx, AudioController.tsx, AnimationSequence.ts, ParticleExplosion.ts, ShimmerRing.ts, etc.) define the startup/transition experience with accessible animations and optional audio
- Utilities (app/utils/)
  - AssetManager.ts manages static assets; WebGLContextManager.ts coordinates WebGL context lifecycles
  - PerformanceMonitor.ts and PerformanceConfig.ts provide runtime instrumentation and knobs for tuning
  - detectTouch.ts, sayHello.ts small environment-specific helpers
- Types
  - types/three-examples.d.ts augments Three.js example types used by loaders and utilities
- Public assets
  - public/ contains EXR/PNG textures, fonts, icons, and other static assets referenced at runtime

Notes and conventions
- Path aliases: "@/*" maps to the repo root and ./src/* via tsconfig.json (paths). Prefer imports like import X from "@/app/galaxy/...".
- Dual app folders: The active application lives under app/. A minimal Next starter also exists under src/app/; routes and components in app/ take precedence.
- Dev port: The dev and prod servers default to 9999 (scripts pass --port 9999). Playwright uses baseURL=http://localhost:9999.
- Next.js config: next.config.ts currently contains a minimal default export and can be extended for image domains, headers, redirects, etc., as needed.

Where to look first (big picture)
- app/page.tsx and app/layout.tsx to see entry and layout
- app/galaxy/GalaxyCanvas.tsx as the orchestrator of the 3D scene
- app/galaxy/core/* for how the scene is constructed and updated frame-to-frame
- app/components/loading/* for the startup sequence and UX
- tests/ for testing strategy: unit, integration, contract, performance, and e2e under tests/e2e

Repository docs used
- README.md: Provided key setup, port, and script information incorporated above

