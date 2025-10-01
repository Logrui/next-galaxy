'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import GUI from 'lil-gui';
import { random } from 'canvas-sketch-util';
import createInputEvents from 'simple-input-events';
import { fragmentSource, vertexSource } from './shaders';
import { CAMERA_PRESETS } from './location_presets';
import { createCameraAnimator, CameraAnimator } from './camera_animator';
import { createCameraInfoOverlay } from './ui/createCameraInfoOverlay';
import { createPresetButtons } from './ui/createPresetButtons';
import { createPhasePanel } from './ui/createPhasePanel';
import { createPathPanel } from './ui/createPathPanel';
import { createStatusPanel } from './ui/createStatusPanel';
import { getGeometryForPhase } from './presets';
import { createUniforms } from './core/createUniforms';
import { createMaterial } from './core/createMaterial';
import { createPointCloud } from './core/createPointCloud';
import { createDebugGUI } from './core/createDebugGUI';
import { createInteraction } from './core/createInteraction';
import { createAnimationLoop } from './core/createAnimationLoop';
import { ParticleSystemState } from './types';

const ENABLE_INTRO_SEQUENCE = true;

interface GalaxyCanvasProps {
  loadingParticleState?: ParticleSystemState;
}

export default function GalaxyCanvas({ loadingParticleState }: GalaxyCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debugSphereRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const pointerRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [isClient, setIsClient] = useState(false);
  const cameraInfoRef = useRef<HTMLDivElement | null>(null);
  const presetButtonsRef = useRef<HTMLDivElement | null>(null);
  const cameraAnimatorRef = useRef<CameraAnimator | null>(null);
  const statusPanelRef = useRef<{ element: HTMLDivElement; update: ()=>void; destroy: ()=>void } | null>(null);
  const loadingParticleStateRef = useRef<ParticleSystemState | null>(null);
  const introReadyRef = useRef(false);
  const introTriggeredRef = useRef(false);
  const startIntroFnRef = useRef<() => void>(() => {});
  // Guard to avoid double init in React 18 StrictMode dev (mount -> unmount -> remount)
  const didInitRef = useRef(false);

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

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    // Three r150+: use outputColorSpace instead of outputEncoding
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // physicallyCorrectLights was removed in Three.js r150+ - lighting is now physically correct by default
    renderer.autoClear = false;

    el.appendChild(renderer.domElement);

    // Modular camera info overlay
  const cameraInfoOverlay = createCameraInfoOverlay(el);
  cameraInfoRef.current = cameraInfoOverlay.element;


    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, el.clientWidth / el.clientHeight, 1, 4000);
    // Apply Start preset if available, otherwise fall back to previous default
    const startPreset = CAMERA_PRESETS.find(p => p.name === 'Start');
    if (startPreset) {
      camera.position.set(startPreset.position.x, startPreset.position.y, startPreset.position.z);
    } else {
      camera.position.set(59.3, 196, 355);
    }
    const controls = new OrbitControls(camera, renderer.domElement);

    // Initialize camera animator
    const cameraAnimator = createCameraAnimator(camera, controls);
    cameraAnimatorRef.current = cameraAnimator;

  // Modular preset buttons (after animator exists)
  const presetButtonsPanel = createPresetButtons(el, cameraAnimator);
  presetButtonsRef.current = presetButtonsPanel.element;

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
    debugSphereRef.current = debugSphere;

    // Invisible plane for mouse projection
    const invisiblePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    invisiblePlane.rotation.x = -Math.PI / 2;
    invisiblePlane.visible = false;
    scene.add(invisiblePlane);

    // Debug GUI
    const { gui, settings, dispose: disposeGUI } = createDebugGUI({ uniforms, camera, controls });

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
      // Start animation loop once texture ready
      animationHandle = createAnimationLoop({
        uniforms,
        renderer,
        scene,
        camera,
        material,
        settings,
        cameraInfoElement: cameraInfoRef.current,
        controls,
        cameraInfoAPI: cameraInfoOverlay // pass full API so loop can call update()
      });
      introReadyRef.current = true;
      if(ENABLE_INTRO_SEQUENCE){
        tryStartIntro();
      }
      const statusTick = () => { if(statusPanelRef.current) statusPanelRef.current.update(); requestAnimationFrame(statusTick); };
      requestAnimationFrame(statusTick);
    });

    // Interaction
    const interaction = createInteraction({
      element: el,
      renderer,
      camera,
      pointer: pointerRef.current,
      raycaster: raycasterRef.current,
      invisiblePlane,
      debugSphere: debugSphere,
      uniforms,
    });

    // Animation loop handle
    let animationHandle: { stop: () => void } | null = null;

    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Phase panel module integration
    function positionPhase(panel: HTMLElement){
      if(!presetButtonsRef.current || !containerRef.current) return;
      const rect = presetButtonsRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const left = (rect.left - containerRect.left) + rect.width + 16;
      panel.style.left = `${left}px`;
    }
    const phasePanelAPI = createPhasePanel({
      container: el,
      getPhaseMix: () => uniforms.phaseMix.value,
      getDyingMix: () => uniforms.dyingMix.value,
      animatePhase: (target:number,duration=1400)=>{
        const startVal = uniforms.phaseMix.value;
        if(Math.abs(startVal-target)<0.0001) return;
        const startTime = performance.now();
        function step(now:number){
          const t = Math.min(1,(now-startTime)/duration);
          const eased = t<0.5?4.0*t*t*t:1.0-Math.pow(-2.0*t+2.0,3.0)/2.0;
          uniforms.phaseMix.value = startVal + (target-startVal)*eased;
          if(t<1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      },
      animateDying: (target:number,duration=1600)=>{
        const startVal = uniforms.dyingMix.value;
        if(Math.abs(startVal-target)<0.0001) return;
        const startTime = performance.now();
        function step(now:number){
          const t = Math.min(1,(now-startTime)/duration);
          const eased = t*t*(3.0-2.0*t);
          uniforms.dyingMix.value = startVal + (target-startVal)*eased;
          if(t<1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }
    });
    requestAnimationFrame(()=>positionPhase(phasePanelAPI.element));

    // Path variants panel (simple immediate uniform update; easing can be added later if desired)
    // Path transition animation helper
    function animatePathTransition(target:number, duration=1400){
      const startMode = uniforms.toPathMode.value;
      if(startMode === target){ return; }
      uniforms.fromPathMode.value = startMode;
      uniforms.toPathMode.value = target;
      const startTime = performance.now();
      function step(now:number){
        const t = Math.min(1, (now-startTime)/duration);
        // smoothstep easing
        const eased = t*t*(3-2*t);
        uniforms.pathMix.value = eased;
        if(t<1) requestAnimationFrame(step); else {
          // finalize legacy reference for consistency
          uniforms.extraPathMode.value = target;
          uniforms.fromPathMode.value = target;
          uniforms.toPathMode.value = target;
          uniforms.pathMix.value = 1.0;
        }
      }
      uniforms.pathMix.value = 0.0;
      requestAnimationFrame(step);
    }

    const pathPanelAPI = createPathPanel({
      container: el,
      getMode: () => uniforms.toPathMode.value as any,
      setMode: (m) => { animatePathTransition(m, 1600); }
    });
    const statusPanelAPI = createStatusPanel({
      container: el,
      getPhaseMix: () => uniforms.phaseMix.value,
      getDyingMix: () => uniforms.dyingMix.value,
      getFromPath: () => uniforms.fromPathMode.value as any,
      getToPath: () => uniforms.toPathMode.value as any,
      getPathMix: () => uniforms.pathMix.value,
    });
    statusPanelRef.current = statusPanelAPI;

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
        seqAnimateNumber(uniforms.dyingMix, 0.0, 600, easeSmooth); // collapse release
        seqAnimateNumber(uniforms.phaseMix, 0.0, 600, easeInOutCubic); // nebula->galaxy morph quickly
        animatePathTransition(1, 800); // Vortex -> Spiral
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
        animatePathTransition(0, 800); // Spiral -> Base (camera still moving until t=12s)
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
  phasePanelAPI.setPhase('galaxy');

    // Hook into resize AFTER onResize is defined
  const phasePanelResize = () => positionPhase(phasePanelAPI.element);
    window.addEventListener('resize', phasePanelResize);

    // Add to cleanup
    return () => {
      introReadyRef.current = false;
      introTriggeredRef.current = false;
      loadingParticleStateRef.current = null;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('resize', phasePanelResize);
  interaction.dispose();
  disposeGUI();
  if(animationHandle) animationHandle.stop();
      if (cameraAnimatorRef.current) {
        cameraAnimatorRef.current.dispose();
      }
      renderer.dispose();
      geo.dispose();
      material.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      if (cameraInfoRef.current && el.contains(cameraInfoRef.current)) {
        el.removeChild(cameraInfoRef.current);
      }
      if (presetButtonsRef.current && el.contains(presetButtonsRef.current)) {
        el.removeChild(presetButtonsRef.current);
      }
      if (overlay.parentElement === el) {
        el.removeChild(overlay);
      }
      if (phasePanelAPI.element && el.contains(phasePanelAPI.element)) {
        el.removeChild(phasePanelAPI.element);
      }
      if (pathPanelAPI.element && el.contains(pathPanelAPI.element)) {
        el.removeChild(pathPanelAPI.element);
      }
      if(statusPanelRef.current && statusPanelRef.current.element && el.contains(statusPanelRef.current.element)){
        el.removeChild(statusPanelRef.current.element);
      }
    };
  }, [isClient, tryStartIntro]);

  if (!isClient) {
    return <div style={{ width: '100%', height: '100vh', background: '#000' }} />;
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100vh', background: '#000' }} />;
}
