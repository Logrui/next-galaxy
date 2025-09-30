'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import GUI from 'lil-gui';
import { random } from 'canvas-sketch-util';
import createInputEvents from 'simple-input-events';
import { fragmentSource, vertexSource } from './shaders';
import sayHello from '../utils/sayHello';
import { CAMERA_PRESETS } from './location_presets';
import { createCameraAnimator, CameraAnimator } from './camera_animator';
import { createCameraInfoOverlay } from './ui/createCameraInfoOverlay';
import { createPresetButtons } from './ui/createPresetButtons';
import { createPhasePanel } from './ui/createPhasePanel';
import { getGeometryForPhase } from './presets';
import { createUniforms } from './core/createUniforms';
import { createMaterial } from './core/createMaterial';
import { createPointCloud } from './core/createPointCloud';
import { createDebugGUI } from './core/createDebugGUI';
import { createInteraction } from './core/createInteraction';
import { createAnimationLoop } from './core/createAnimationLoop';

export default function GalaxyCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debugSphereRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const pointerRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [isClient, setIsClient] = useState(false);
  const cameraInfoRef = useRef<HTMLDivElement | null>(null);
  const presetButtonsRef = useRef<HTMLDivElement | null>(null);
  const cameraAnimatorRef = useRef<CameraAnimator | null>(null);

  // Hydration-safe effect
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const el = containerRef.current;
    if (!el) return;

    // Console branding like original
    sayHello();

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

    // Schedule transition to Overview after small delay (animate over 3s)
    const overviewPreset = CAMERA_PRESETS.find(p => p.name === 'Overview');
    if (startPreset && overviewPreset) {
      setTimeout(() => {
        cameraAnimator.animateToPreset(overviewPreset, { duration: 3, ease: 'power2.inOut' });
      }, 300); // allow initial frame to render at Start position
    }

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
      });
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

    // Initialize phase panel visual state
    phasePanelAPI.setPhase('nebula');

    // Hook into resize AFTER onResize is defined
  const phasePanelResize = () => positionPhase(phasePanelAPI.element);
    window.addEventListener('resize', phasePanelResize);

    // Add to cleanup
    return () => {
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
      if (phasePanelAPI.element && el.contains(phasePanelAPI.element)) {
        el.removeChild(phasePanelAPI.element);
      }
    };
  }, [isClient]);

  if (!isClient) {
    return <div style={{ width: '100%', height: '100vh', background: '#000' }} />;
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100vh', background: '#000' }} />;
}
