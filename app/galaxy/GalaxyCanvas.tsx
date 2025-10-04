'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import GUI from 'lil-gui';
import { random } from 'canvas-sketch-util';
import { fragmentSource, vertexSource } from './shaders';
import { CAMERA_PRESETS } from './location_presets';
import { createCameraAnimator, CameraAnimator } from './camera_animator';
import { getGeometryForPhase } from './presets';
import { createUniforms } from './core/createUniforms';
import { createMaterial } from './core/createMaterial';
import { createPointCloud } from './core/createPointCloud';
import { createDebugGUI } from './core/createDebugGUI';
import { ParticleSystemState } from './types';

// Manager system imports
import { useGalaxyStateManager } from './hooks/useGalaxyStateManager';
import { SceneManager } from './managers/SceneManager';
import { AnimationManager } from './managers/AnimationManager';
import { InteractionManager } from './managers/InteractionManager';
import { ParameterManager } from './managers/ParameterManager';
import { UIManager } from './managers/UIManager';

// Refactored panel imports
import { CameraInfoPanel } from './ui/CameraInfoPanel';
import { PresetButtonsPanel } from './ui/PresetButtonsPanel';
import { PhasePanel } from './ui/PhasePanel';
import { StatusPanel } from './ui/StatusPanel';
import { PathPanel } from './ui/PathPanel';

const ENABLE_INTRO_SEQUENCE = true;

interface GalaxyCanvasProps {
  loadingParticleState?: ParticleSystemState;
}

export default function GalaxyCanvas({ loadingParticleState }: GalaxyCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isClient, setIsClient] = useState(false);
  const cameraAnimatorRef = useRef<CameraAnimator | null>(null);
  const loadingParticleStateRef = useRef<ParticleSystemState | null>(null);
  const introReadyRef = useRef(false);
  const introTriggeredRef = useRef(false);
  const startIntroFnRef = useRef<() => void>(() => {});
  // Guard to avoid double init in React 18 StrictMode dev (mount -> unmount -> remount)
  const didInitRef = useRef(false);

  // Initialize GalaxyStateManager (NEW - manager system)
  const stateManager = useGalaxyStateManager({
    interactionMode: 'free',
    isInitialized: false,
    loadingProgress: 0,
  });

  const tryStartIntro = useCallback(() => {
    if (!ENABLE_INTRO_SEQUENCE) return;
    if (introTriggeredRef.current) return;
    if (!introReadyRef.current) return;
    if (!loadingParticleStateRef.current) return;
    introTriggeredRef.current = true;
    startIntroFnRef.current();
  }, []);

  // Hydration-safe effect
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Store particle handoff for forthcoming transitions without triggering unnecessary re-renders
  useEffect(() => {
    if (loadingParticleState) {
      loadingParticleStateRef.current = loadingParticleState;
      tryStartIntro();
    }
  }, [loadingParticleState, tryStartIntro]);

  useEffect(() => {
    if (!isClient) return;
    if(didInitRef.current){
      return; // Prevent re-initialization (avoids camera reset after intro)
    }
    didInitRef.current = true;
    introReadyRef.current = false;
    introTriggeredRef.current = false;
    
    const el = containerRef.current;
    if (!el) return;

    // Initialize SceneManager (NEW - replaces manual Three.js setup)
    const sceneManager = new SceneManager(el);
    const renderer = sceneManager.getRenderer();
    const scene = sceneManager.getScene();
    const camera = sceneManager.getCamera();
    const controls = sceneManager.getControls();

    // Configure renderer for galaxy scene
    renderer.autoClear = false;

    // Apply Start preset if available, otherwise fall back to previous default
    const startPreset = CAMERA_PRESETS.find(p => p.name === 'Start');
    if (startPreset) {
      camera.position.set(startPreset.position.x, startPreset.position.y, startPreset.position.z);
    } else {
      camera.position.set(59.3, 196, 355);
    }

    // Initialize camera animator
    const cameraAnimator = createCameraAnimator(camera, controls);
    cameraAnimatorRef.current = cameraAnimator;

    // Ensure target reflects Start preset
    if (startPreset) {
      controls.target.set(startPreset.target.x, startPreset.target.y, startPreset.target.z);
      controls.update();
    }

    // Custom intro sequence replaces previous single auto camera move.
    const overviewPreset = CAMERA_PRESETS.find(p => p.name === 'Overview');
    const closeUpPreset = CAMERA_PRESETS.find(p => /close( |-)up/i.test(p.name) || p.name === 'Close Up' || p.name === 'CloseUp');

    const lockCameraToPreset = (preset = overviewPreset) => {
      if (!preset) {
        return;
      }
      if (cameraAnimator.isAnimating()) {
        cameraAnimator.stopAnimation();
      }
      camera.position.set(preset.position.x, preset.position.y, preset.position.z);
      controls.target.set(preset.target.x, preset.target.y, preset.target.z);
      controls.update();
      if (typeof (controls as any).saveState === 'function') {
        (controls as any).saveState();
      }
    };

    // Uniforms & material
    const uniforms = createUniforms();
    const material = createMaterial({ vertexShader: vertexSource, fragmentShader: fragmentSource, uniforms });

    // Point cloud
    const { points, geometry: geo } = createPointCloud({ phase: 'nebula', count: 32768, extent: 300, material });
    scene.add(points);

    // Central sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(11, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    scene.add(sphere);

    // Raycaster setup
    const debugSphere = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    scene.add(debugSphere);

    // Invisible plane for mouse projection
    const invisiblePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    invisiblePlane.rotation.x = -Math.PI / 2;
    invisiblePlane.visible = false;
    scene.add(invisiblePlane);

    // Debug GUI (closed by default to avoid overlapping custom panels)
    const { gui, settings, dispose: disposeGUI } = createDebugGUI({ uniforms, camera, controls });
    gui.close(); // Close by default, can be reopened via the toggle button

    // Initialize ParameterManager (NEW - manages shader parameters with GSAP transitions)
    const parameterManager = new ParameterManager(uniforms, stateManager);

    // Initialize AnimationManager (NEW - replaces createAnimationLoop)
    const animationManager = new AnimationManager();
    animationManager.start();

    // Textures from Next public/
    const loader = new THREE.TextureLoader();
    loader.load('/scale-texture.png', (tex) => {
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      material.uniforms.scaleTex.value = tex;
    });
    loader.load('/color-tiles.png', (tex) => {
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      material.uniforms.color.value = tex;
    });

    new EXRLoader().load('/ani-tiles.exr', (texture) => {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      material.uniforms.posTex.value = texture;
      
      // Register animation callbacks (NEW - replaces createAnimationLoop)
      let frameCount = 0;
      const renderCallback = (deltaTime: number) => {
        // Update controls
        controls.update();
        
        // Update camera info panel
        cameraInfoPanel.update({ camera, controls });
        
        // Update status panel
        statusPanel.update({});
        
        // Update uniforms time (FIXED: use constant 0.05 per frame like original)
        uniforms.time.value += 0.05;
        
        // Debug logging every 60 frames (~1 second)
        if (frameCount++ % 60 === 0) {
          console.log('[RenderLoop] Frame:', frameCount, 'Time:', uniforms.time.value.toFixed(2), 'DeltaTime:', deltaTime.toFixed(4));
        }
        
        // Sync debug GUI settings to uniforms (FIXED: restore GUI sync)
        uniforms.fdAlpha.value = settings.fdAlpha;
        uniforms.superScale.value = settings.superScale;
        
        // Sync camera position to GUI settings (for GUI display)
        settings.cameraX = camera.position.x;
        settings.cameraY = camera.position.y;
        settings.cameraZ = camera.position.z;
        settings.targetX = controls.target.x;
        settings.targetY = controls.target.y;
        settings.targetZ = controls.target.z;
        
        // Dual-pass rendering for smooth particles (FIXED: restore glow pass)
        // Pass 1: Glow layer
        renderer.clear();
        material.uniforms.glow.value = 1;
        material.uniforms.superOpacity.value = settings.fdAlpha;
        material.uniforms.superScale.value = settings.superScale;
        renderer.render(scene, camera);
        
        // Pass 2: Main layer (over glow)
        renderer.clearDepth();
        material.uniforms.glow.value = 0;
        material.uniforms.fade.value = settings.progress;
        material.uniforms.superOpacity.value = 1;
        renderer.render(scene, camera);
      };
      animationManager.addFrameCallback(renderCallback);
      
      introReadyRef.current = true;
      if(ENABLE_INTRO_SEQUENCE){
        tryStartIntro();
      }
    });

    // Initialize InteractionManager (NEW - replaces createInteraction)
    const interactionManager = new InteractionManager(sceneManager, stateManager);
    interactionManager.setMode('free'); // Default to free mode

    // Initialize UIManager (NEW - manages all UI panels)
    const uiManager = new UIManager(el, stateManager, sceneManager);

    // Create and register all panels (NEW - using Panel base class)
    const cameraInfoPanel = new CameraInfoPanel(el);
    uiManager.addPanel('cameraInfo', cameraInfoPanel);

    const presetButtonsPanel = new PresetButtonsPanel(el, cameraAnimator);
    uiManager.addPanel('presetButtons', presetButtonsPanel);

    const phasePanel = new PhasePanel(el, {
      getPhaseMix: () => uniforms.phaseMix.value,
      getDyingMix: () => uniforms.dyingMix.value,
      animatePhase: (target: number, duration?: number) => {
        parameterManager.transitionToParameters({ phaseMix: target }, duration);
      },
      animateDying: (target: number, duration?: number) => {
        parameterManager.transitionToParameters({ dyingMix: target }, duration);
      },
    });
    uiManager.addPanel('phase', phasePanel);

    const pathPanel = new PathPanel(el, {
      getMode: () => uniforms.toPathMode.value as any,
      setMode: (m, duration = 1400) => {
        // Path transition with fromPath/toPath logic (matches original animatePathTransition)
        const startMode = uniforms.toPathMode.value;
        if (startMode === m) return; // Already at target mode
        
        uniforms.fromPathMode.value = startMode;
        uniforms.toPathMode.value = m;
        uniforms.pathMix.value = 0.0;
        
        // Animate pathMix from 0 to 1 for smooth transition
        const startTime = performance.now();
        
        const animatePathMix = (now: number) => {
          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / duration);
          const eased = t * t * (3 - 2 * t); // smoothstep easing
          
          uniforms.pathMix.value = eased;
          
          if (t < 1) {
            requestAnimationFrame(animatePathMix);
          } else {
            // Finalize: set all references to target mode
            uniforms.extraPathMode.value = m;
            uniforms.fromPathMode.value = m;
            uniforms.toPathMode.value = m;
            uniforms.pathMix.value = 1.0;
          }
        };
        
        requestAnimationFrame(animatePathMix);
      },
    });
    uiManager.addPanel('path', pathPanel);

    const statusPanel = new StatusPanel(el, {
      getPhaseMix: () => uniforms.phaseMix.value,
      getDyingMix: () => uniforms.dyingMix.value,
      getFromPath: () => uniforms.fromPathMode.value as any,
      getToPath: () => uniforms.toPathMode.value as any,
      getPathMix: () => uniforms.pathMix.value,
    });
    uiManager.addPanel('status', statusPanel);

    // Show all panels
    uiManager.showPanel('cameraInfo');
    uiManager.showPanel('presetButtons');
    uiManager.showPanel('phase');
    uiManager.showPanel('path');
    uiManager.showPanel('status');

    // NOTE: Window resize is now handled automatically by SceneManager
    // NOTE: Animation loop is now handled by AnimationManager
    // NOTE: Panel lifecycle is now handled by UIManager

  // Intro cinematic sequence:
  // 0s   : Dying Star phase (dyingMix=1), Vortex path (mode 4), camera Close Up preset
  // 3s   : Begin transition to Galaxy (phaseMix->0) & path Vortex -> Spiral
  // 6s   : Final to Galaxy base (mode 0), remain at Overview
    function seqAnimateNumber(ref:{ value:number }, target:number, duration:number, ease:(t:number)=>number){
      const startVal = ref.value; if(Math.abs(startVal-target)<0.0001) return;
      const t0 = performance.now();
      function step(now:number){
        const t = Math.min(1,(now-t0)/duration); ref.value = startVal + (target-startVal)*ease(t);
        if(t<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    const easeInOutCubic = (t:number)=> t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const easeSmooth = (t:number)=> t*t*(3-2*t);

    const ENABLE_INTRO_SEQUENCE = true; // cinematic intro enabled

    if(ENABLE_INTRO_SEQUENCE){
      // Set initial dramatic state (Dying Star + Vortex) BEFORE first frame renders
      uniforms.phaseMix.value = 1.0; // Nebula side
      uniforms.dyingMix.value = 1.0; // Fully collapsed / dying effect
      uniforms.extraPathMode.value = 4; // Vortex
      uniforms.fromPathMode.value = 4;
      uniforms.toPathMode.value = 4;
      uniforms.pathMix.value = 1.0;
      // Start camera at Close Up position immediately (no initial Overview flash)
      if(closeUpPreset){
        camera.position.set(closeUpPreset.position.x, closeUpPreset.position.y, closeUpPreset.position.z);
        controls.target.set(closeUpPreset.target.x, closeUpPreset.target.y, closeUpPreset.target.z);
        controls.update();
      }
    } else {
      // Baseline final/default state (when intro disabled): Galaxy + Base Path + Overview.
      uniforms.phaseMix.value = 0.0; // Galaxy
      uniforms.dyingMix.value = 0.0; // Not dying
      uniforms.extraPathMode.value = 0; // Base path
      uniforms.fromPathMode.value = 0;
      uniforms.toPathMode.value = 0;
      uniforms.pathMix.value = 1.0;
      if(overviewPreset){
        camera.position.set(overviewPreset.position.x, overviewPreset.position.y, overviewPreset.position.z);
        controls.target.set(overviewPreset.target.x, overviewPreset.target.y, overviewPreset.target.z);
        controls.update();
      }
    }

    // Minimal black overlay that fades out automatically (no text)
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute; inset:0; background:#000; z-index:1500; opacity:0; transition:opacity 1.5s ease; pointer-events:none; display:none;`;
    el.appendChild(overlay);
    function revealSceneWithOverlayFade(){
      overlay.style.display = 'block';
      overlay.style.opacity = '1';
      requestAnimationFrame(()=>{
        overlay.style.opacity = '0';
      });
      setTimeout(()=>{ if(el && overlay.parentElement===el) el.removeChild(overlay); }, 1600);
    }

    function startIntro(){
      console.log('[Intro] Starting intro sequence. Initial camera position:', camera.position.toArray());
      // Camera refine (animate into exact Close Up framing if preset defined)
      if(closeUpPreset){ cameraAnimator.animateToPreset(closeUpPreset, { duration: 0.8, ease:'power2.inOut' }).catch(()=>{}); }
      // Hold initial dramatic state fully for 6s, then transition to Spiral/Galaxy
      setTimeout(()=>{
        // Boundary 1 (t=6s): start transitions to middle state
        // Use ParameterManager for smooth transitions (replaces seqAnimateNumber)
        parameterManager.transitionToParameters({ dyingMix: 0.0 }, 600);
        parameterManager.transitionToParameters({ phaseMix: 0.0 }, 600);
        // Vortex -> Spiral path transition (800ms duration)
        pathPanel.setMode(1, 800);
        // Camera begins long 6s pull-out toward Overview (finishes at t≈12s)
        if(overviewPreset){
          console.log('[Intro] Begin 6s camera pull to Overview preset');
          const startPos = camera.position.clone();
          const startTarget = controls.target.clone();
          const endPos = new THREE.Vector3(overviewPreset.position.x, overviewPreset.position.y, overviewPreset.position.z);
          const endTarget = new THREE.Vector3(overviewPreset.target.x, overviewPreset.target.y, overviewPreset.target.z);
          let fallbackTriggered = false;
          cameraAnimator.animateToPreset(overviewPreset, {
            duration: 6000,
            ease:'power2.inOut',
            onUpdate: ()=>{},
            onComplete: ()=>{
              if(!fallbackTriggered){
                lockCameraToPreset(overviewPreset);
                console.log('[Intro] Camera pull complete (GSAP)', camera.position.toArray());
              }
            }
          }).catch(()=>{ console.warn('[Intro] Camera animation promise rejected'); });
          // Verify movement; if no movement after a couple frames, fallback to manual rAF tween
          let checks = 0; const baseline = camera.position.clone();
          function verify(){
            checks++;
            if(checks===3){
              const dist = camera.position.distanceTo(baseline);
              if(dist < 0.0005){
                console.warn('[Intro] GSAP camera tween inactive, starting fallback');
                fallbackTriggered = true;
                cameraAnimator.stopAnimation();
                const t0 = performance.now();
                function step(now:number){
                  const t = Math.min(1, (now-t0)/6000);
                  const easeT = t*t*(3-2*t);
                  camera.position.lerpVectors(startPos, endPos, easeT);
                  controls.target.lerpVectors(startTarget, endTarget, easeT);
                  controls.update();
                  if(t<1) {
                    requestAnimationFrame(step);
                  } else {
                    lockCameraToPreset(overviewPreset);
                    console.log('[Intro] Camera pull complete (fallback)', camera.position.toArray());
                  }
                }
                requestAnimationFrame(step);
              }
            }
            if(checks<4) requestAnimationFrame(verify);
          }
          requestAnimationFrame(verify);
        }
      }, 6000);
      // Boundary 2 (t=9s): still during camera pull; transition Spiral -> Base while camera continues
      setTimeout(()=>{
        pathPanel.setMode(0, 800); // Spiral -> Base (800ms duration, camera still moving until t=12s)
      }, 9000);
      // (Final stable composition reached near t=9.8s while camera completes glide by t=12s)
  // Start fading overlay immediately (simple 1.5s fade)
  revealSceneWithOverlayFade();
    }
    startIntroFnRef.current = startIntro;
  // Defer startIntro until after core textures/loop ready and Begin clicked

    // Legacy fade (still available for other UI fades)
    function animateFade(from: number, to: number, duration = 800) {
      const start = performance.now();
      function step(now: number) {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t);
        uniforms.fade.value = from + (to - from) * eased;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function animatePhase(target: number, duration = 1400) {
      const startVal = uniforms.phaseMix?.value ?? 1.0;
      if (!uniforms.phaseMix) return;
      if (Math.abs(startVal - target) < 0.0001) return;
      const startTime = performance.now();
      function step(now: number) {
        const t = Math.min(1, (now - startTime) / duration);
  const eased = t < 0.5 ? 4.0 * t * t * t : 1.0 - Math.pow(-2.0 * t + 2.0, 3.0)/2.0;
        uniforms.phaseMix.value = startVal + (target - startVal) * eased;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function animateDying(target: number, duration = 1600) {
      const startVal = uniforms.dyingMix?.value ?? 0.0;
      if (!uniforms.dyingMix) return;
      if (Math.abs(startVal - target) < 0.0001) return;
      const startTime = performance.now();
      function step(now: number) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = t * t * (3.0 - 2.0 * t);
        uniforms.dyingMix.value = startVal + (target - startVal) * eased;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

  // Initialize phase panel visual state to Galaxy (prevent unwanted nebula morph)
  phasePanel.setPhase('galaxy');

    // Add to cleanup
    return () => {
      introReadyRef.current = false;
      introTriggeredRef.current = false;
      loadingParticleStateRef.current = null;
      
      // Manager cleanup (NEW)
      animationManager.dispose();
      interactionManager.dispose();
      parameterManager.dispose();
      uiManager.dispose(); // Handles all panel cleanup
      
      disposeGUI();
      if (cameraAnimatorRef.current) {
        cameraAnimatorRef.current.dispose();
      }
      // SceneManager handles renderer, scene, camera, controls disposal
      sceneManager.dispose();
      // Still need to manually dispose geometry and material (not managed by SceneManager yet)
      geo.dispose();
      material.dispose();
      if (overlay.parentElement === el) {
        el.removeChild(overlay);
      }
    };
  }, [isClient, tryStartIntro]);

  if (!isClient) {
    return <div style={{ width: '100%', height: '100vh', background: '#000' }} />;
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100vh', background: '#000' }} />;
}
