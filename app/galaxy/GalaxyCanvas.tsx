'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import GUI from 'lil-gui';
import { random } from 'canvas-sketch-util';
import createInputEvents from 'simple-input-events';
import { fragmentSource, vertexSource } from './shaders';
import { generateNebulaGeometry } from './presets/nebula';
import { generateGalaxyGeometry } from './presets/galaxy';
import { generateDyingStarGeometry } from './presets/dyingStar';
import { generateNeutronStarGeometry } from './presets/neutronStar';
import { generateNeutronStar2Geometry, neutronStar2Axis } from './presets/neutronStar2';

import sayHello from '../utils/sayHello';
import { CameraInfoPanel } from './debug-ui/CameraInfoPanel';
import { CameraPresetPanel } from './debug-ui/CameraPresetPanel';
import { PhasePanel } from './debug-ui/PhasePanel';
import { CAMERA_PRESETS, applyCameraPreset } from './location_presets';
import { createCameraAnimator, CameraAnimator } from './camera_animator';


export default function GalaxyCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debugSphereRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const pointerRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [isClient, setIsClient] = useState(false);
  const cameraAnimatorRef = useRef<CameraAnimator | null>(null);

  // UI state for React panels
  const [cameraPosition, setCameraPosition] = useState({ x: 59.3, y: 196, z: 355 });
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 0, z: 0 });
  const [phase, setPhase] = useState<'nebula' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2'>('nebula');
  const [phaseMix, setPhaseMix] = useState(1.0);
  const [dyingMix, setDyingMix] = useState(0.0);

  // Hydration-safe effect
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const el = containerRef.current;
    if (!el) return;
    sayHello();
    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.autoClear = false;
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, el.clientWidth / el.clientHeight, 1, 4000);
    const startPreset = CAMERA_PRESETS.find(p => p.name === 'Start');
    if (startPreset) {
      camera.position.set(startPreset.position.x, startPreset.position.y, startPreset.position.z);
    } else {
      camera.position.set(59.3, 196, 355);
    }
    const controls = new OrbitControls(camera, renderer.domElement);
    const cameraAnimator = createCameraAnimator(camera, controls);
    cameraAnimatorRef.current = cameraAnimator;
    if (startPreset) {
      controls.target.set(startPreset.target.x, startPreset.target.y, startPreset.target.z);
      controls.update();
    }
    const overviewPreset = CAMERA_PRESETS.find(p => p.name === 'Overview');
    if (startPreset && overviewPreset) {
      setTimeout(() => {
        cameraAnimator.animateToPreset(overviewPreset, { duration: 3, ease: 'power2.inOut' });
      }, 300);
    }

    // Uniforms
    const uniforms: { [key: string]: any } = {
      time: { value: 9 },
      resolution: { value: new THREE.Vector4() },
      duration: { value: 10 },
      envStart: { value: 1.25 },
      interpolate: { value: false },
      fade: { value: 0 },
      fdAlpha: { value: 0 },
      globalAlpha: { value: 1 },
      posTex: { value: null },
      color: { value: null },
      scaleTex: { value: null },
      scale: { value: 1 },
      size: { value: 2.6 },
      nebula: { value: false },
      focalDistance: { value: 385 },
      aperture: { value: 500 },
      maxParticleSize: { value: 8 },
      tint: { value: new THREE.Color('#fff') },
      glow: { value: false },
  debugMode: { value: false },
      superOpacity: { value: 1 },
      superScale: { value: 1 },
      hover: { value: 0 },
      planets: { value: [
        new THREE.Vector3(0,0,0),
        new THREE.Vector3(10000,10000,10000),
        new THREE.Vector3(10000,10000,10000),
        new THREE.Vector3(10000,10000,10000),
        new THREE.Vector3(10000,10000,10000),
        new THREE.Vector3(10000,10000,10000),
        new THREE.Vector3(10000,10000,10000),
        new THREE.Vector3(10000,10000,10000),
      ] },
      hoverPoint: { value: new THREE.Vector3(0,0,0) },
      interaction: { value: new THREE.Vector4(0,0,0,0) },
      iRadius: { value: 11 },
      nebulaAmp: { value: 1.5 },
      phaseMix: { value: 1.0 },
  dyingMix: { value: 0.0 },
  isNeutronStar2: { value: false },
  stellarMode: { value: false },
  // New neutron star related uniforms
  magneticAxis: { value: new THREE.Vector3(0,0,1) },
  spinRate: { value: 4.0 }, // beam sweep speed
  diskRotationRate: { value: 0.15 },
  jetLength: { value: 300 * 1.2 },
  debugMinimal: { value: false },
    };

    let material = new THREE.RawShaderMaterial({
      vertexShader: vertexSource,
      fragmentShader: fragmentSource,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Geometry
    const Im = 32768;
    const e = 300;
    function logGeometryStats(arr: Float32Array, label: string){
      let minR = Infinity, maxR = -Infinity, sumR = 0;
      const len = arr.length/3;
      for(let i=0;i<len;i++){
        const x = arr[i*3]; const y = arr[i*3+1]; const z = arr[i*3+2];
        const r = Math.sqrt(x*x+y*y+z*z);
        minR = Math.min(minR, r); maxR = Math.max(maxR, r); sumR += r;
      }
      console.log(`[GeoStats] ${label}: count=${len} rMin=${minR.toFixed(2)} rMax=${maxR.toFixed(2)} rAvg=${(sumR/len).toFixed(2)}`);
    }

    function getGeometryForPhase(phase: 'nebula' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2') {
      if (phase === 'nebula') return generateNebulaGeometry(Im, e);
      if (phase === 'galaxy') return generateGalaxyGeometry(Im, e);
      if (phase === 'dying') return generateDyingStarGeometry(Im, e);
      if (phase === 'neutron') return generateNeutronStarGeometry(Im, e);
      if (phase === 'neutronStar2') return generateNeutronStar2Geometry(Im, e);
      return generateGalaxyGeometry(Im, e);
    }
    let currentPhase: 'nebula' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2' = 'nebula';
  let s = getGeometryForPhase(currentPhase);
  logGeometryStats(s, currentPhase);
    const t = new Float32Array(Im * 2);
    let n = 0;
    for (let r = 0; r < 128; r++) {
      for (let o = 0; o < 256; o++) {
        t[n * 2] = 1 / 256 + o / 257;
        t[n * 2 + 1] = 1 / 128 + r / 129;
        n++;
      }
    }
    let geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(s, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(t, 2));
  let points: THREE.Points<THREE.BufferGeometry, THREE.Material> = new THREE.Points(geo, material as THREE.Material);
  const simpleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 4, sizeAttenuation: true });
  let useSimple = false;
    points.rotation.x = Math.PI / 2;
    scene.add(points);

    // Simple debug toggle (press 'D')
    window.addEventListener('keydown', (ev) => {
      if(ev.code === 'KeyD') {
        uniforms.debugMode.value = !uniforms.debugMode.value;
        console.log('[Debug] Toggled debugMode =', uniforms.debugMode.value);
        // Log first 5 particle positions for sanity
        const arr = (geo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
        const sample = [] as any[];
        for(let i=0;i<5;i++){ sample.push([arr[i*3], arr[i*3+1], arr[i*3+2]]); }
        console.log('[Debug] Sample positions:', sample);
      }
      if(ev.code === 'KeyM') {
        uniforms.debugMinimal.value = !uniforms.debugMinimal.value;
        console.log('[Debug] Toggled debugMinimal =', uniforms.debugMinimal.value);
      }
    });

    // Helper to regenerate geometry for a new phase
    function regenerateGeometry(phase: 'nebula' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2') {
      const newS = getGeometryForPhase(phase);
      logGeometryStats(newS, phase);
      geo.dispose();
      scene.remove(points);
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(newS, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(t, 2));
  points = new THREE.Points(geo, (useSimple ? simpleMaterial : material) as THREE.Material);
      points.rotation.x = Math.PI / 2;
      scene.add(points);
      if (phase === 'neutronStar2') {
        // Update magnetic axis from geometry module export
        uniforms.magneticAxis.value.copy(neutronStar2Axis.normalize());
        uniforms.isNeutronStar2.value = true;
        uniforms.stellarMode.value = true;
      } else {
        uniforms.isNeutronStar2.value = false;
        uniforms.stellarMode.value = (phase === 'neutron');
      }
    }

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

    // GUI Controls
  const gui = new GUI();
    const settings = {
      progress: 0,
      fdAlpha: 0,
      superScale: 1,
      glow: false,
      nebulaAmp: 1.5,
      cameraX: 59.3,
      cameraY: 196,
      cameraZ: 355,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      focalDistance: 385,
      aperture: 500,
    };
    gui.add(settings, 'progress', 0, 1, 0.01).onChange((value: number) => {
      uniforms.fade.value = value;
    });
    gui.add(settings, 'fdAlpha', 0, 1, 0.01).onChange((value: number) => {
      uniforms.fdAlpha.value = value;
    });
    gui.add(settings, 'superScale', 0, 3, 0.01).onChange((value: number) => {
      uniforms.superScale.value = value;
    });
    gui.add(settings, 'glow').onChange((value: boolean) => {});
    const debugFolder = gui.addFolder('Debug');
    debugFolder.add({ debugMode: false }, 'debugMode').onChange((v:boolean)=>{ uniforms.debugMode.value = v; });
    debugFolder.add({ simplePoints: false }, 'simplePoints').onChange((v:boolean)=>{
      useSimple = v;
  points.material = (v ? simpleMaterial : material) as THREE.Material;
      points.material.needsUpdate = true;
      console.log('[Debug] simplePoints =', v);
    });
    gui.add(settings, 'nebulaAmp', 0, 10, 0.1).onChange((value: number) => {
      uniforms.nebulaAmp.value = value;
    });
    const dofFolder = gui.addFolder('Depth of Field');
    dofFolder.add(settings, 'focalDistance', 50, 1000, 1).onChange((value: number) => {
      uniforms.focalDistance.value = value;
    });
    dofFolder.add(settings, 'aperture', 0, 10000, 1).onChange((value: number) => {
      uniforms.aperture.value = value;
    });
    const cameraFolder = gui.addFolder('Camera Position');
    cameraFolder.add(settings, 'cameraX', -1000, 1000, 1).onChange((value: number) => {
      camera.position.x = value;
    });
    cameraFolder.add(settings, 'cameraY', -1000, 1000, 1).onChange((value: number) => {
      camera.position.y = value;
    });
    cameraFolder.add(settings, 'cameraZ', -1000, 1000, 1).onChange((value: number) => {
      camera.position.z = value;
    });
    const targetFolder = gui.addFolder('Camera Target');
    targetFolder.add(settings, 'targetX', -1000, 1000, 1).onChange((value: number) => {
      controls.target.x = value;
      controls.update();
    });
    targetFolder.add(settings, 'targetY', -1000, 1000, 1).onChange((value: number) => {
      controls.target.y = value;
      controls.update();
    });
    targetFolder.add(settings, 'targetZ', -1000, 1000, 1).onChange((value: number) => {
      controls.target.z = value;
      controls.update();
    });

    // Textures
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
      animate();
    });

    // Mouse interaction
    const inputEvents = createInputEvents(renderer.domElement);
    inputEvents.on('move', ({ position }) => {
      const [x, y] = position;
      pointerRef.current.x = (x / el.clientWidth) * 2 - 1;
      pointerRef.current.y = -(y / el.clientHeight) * 2 + 1;
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const intersects = raycasterRef.current.intersectObject(invisiblePlane);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        uniforms.interaction.value.x = point.x;
        uniforms.interaction.value.y = point.y;
        uniforms.interaction.value.z = point.z;
        uniforms.interaction.value.w = 1;
        debugSphere.position.copy(point);
      }
    });

    function animate() {
  uniforms.time.value += 0.05;
      // Update real-time camera position and target display (React state)
      const camX = Math.round(camera.position.x * 10) / 10;
      const camY = Math.round(camera.position.y * 10) / 10;
      const camZ = Math.round(camera.position.z * 10) / 10;
      const targetX = Math.round(controls.target.x * 10) / 10;
      const targetY = Math.round(controls.target.y * 10) / 10;
      const targetZ = Math.round(controls.target.z * 10) / 10;
      setCameraPosition({ x: camX, y: camY, z: camZ });
      setCameraTarget({ x: targetX, y: targetY, z: targetZ });
      setPhaseMix(uniforms.phaseMix.value);
      setDyingMix(uniforms.dyingMix.value);
      renderer.clear();
      material.uniforms.glow.value = 1;
      material.uniforms.superOpacity.value = settings.fdAlpha;
      material.uniforms.superScale.value = settings.superScale;
      renderer.render(scene, camera);
      renderer.clearDepth();
      material.uniforms.glow.value = 0;
      material.uniforms.fade.value = settings.progress;
      material.uniforms.superOpacity.value = 1;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // --- UI event handlers for React panels ---
    const animateFade = (from: number, to: number, duration = 800) => {
      const start = performance.now();
      function step(now: number) {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t);
        uniforms.fade.value = from + (to - from) * eased;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    const animatePhase = (target: number, duration = 1400) => {
      const startVal = uniforms.phaseMix?.value ?? 1.0;
      if (!uniforms.phaseMix) return;
      if (Math.abs(startVal - target) < 0.0001) return;
      const startTime = performance.now();
      function step(now: number) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = t < 0.5 ? 4.0 * t * t * t : 1.0 - Math.pow(-2.0 * t + 2.0, 3.0)/2.0;
        uniforms.phaseMix.value = startVal + (target - startVal) * eased;
        setPhaseMix(uniforms.phaseMix.value);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    const animateDying = (target: number, duration = 1600) => {
      const startVal = uniforms.dyingMix?.value ?? 0.0;
      if (!uniforms.dyingMix) return;
      if (Math.abs(startVal - target) < 0.0001) return;
      const startTime = performance.now();
      function step(now: number) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = t * t * (3.0 - 2.0 * t);
        uniforms.dyingMix.value = startVal + (target - startVal) * eased;
        setDyingMix(uniforms.dyingMix.value);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };

    // Phase panel handler
    const handlePhaseChange = (target: 'nebula' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2') => {
      if (target === 'nebula') {
        animateDying(0.0, 900);
        animatePhase(1.0, 1500);
        setPhase('nebula');
        regenerateGeometry('nebula');
      } else if (target === 'galaxy') {
        animateDying(0.0, 900);
        animatePhase(0.0, 1500);
        setPhase('galaxy');
        regenerateGeometry('galaxy');
      } else if (target === 'dying') {
        animatePhase(0.0, 1200);
        animateDying(1.0, 1800);
        setPhase('dying');
        regenerateGeometry('dying');
      } else if (target === 'neutron') {
        animateDying(0.0, 900);
        animatePhase(2.0, 1500);
        setPhase('neutron');
        regenerateGeometry('neutron');
      } else if (target === 'neutronStar2') {
        animateDying(0.0, 900);
        animatePhase(3.0, 1500);
        setPhase('neutronStar2');
        regenerateGeometry('neutronStar2');
      }
    };

    // Camera preset handler
    const handleCameraPreset = (presetIdx: number) => {
      if (!cameraAnimatorRef.current) return;
      cameraAnimatorRef.current.animateWithStyle(CAMERA_PRESETS[presetIdx], 'smooth');
    };

    // Expose handlers to React state (via refs or context if needed)
    (window as any).__galaxyUI = {
      handlePhaseChange,
      handleCameraPreset,
    };

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      inputEvents.dispose();
      gui.destroy();
      if (cameraAnimatorRef.current) {
        cameraAnimatorRef.current.dispose();
      }
      renderer.dispose();
      geo.dispose();
      material.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [isClient]);

  // UI panel handlers (must be declared before any conditional return)
  const onPhaseChange = useCallback((target: 'nebula' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2') => {
    if ((window as any).__galaxyUI?.handlePhaseChange) {
      (window as any).__galaxyUI.handlePhaseChange(target);
    }
  }, []);
  const onCameraPreset = useCallback((idx: number) => {
    if ((window as any).__galaxyUI?.handleCameraPreset) {
      (window as any).__galaxyUI.handleCameraPreset(idx);
    }
  }, []);

  if (!isClient) {
    return <div style={{ width: '100%', height: '100vh', background: '#000' }} />;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <CameraInfoPanel cameraPosition={cameraPosition} cameraTarget={cameraTarget} />
      <CameraPresetPanel presets={CAMERA_PRESETS} onPresetClick={onCameraPreset} />
      <PhasePanel
        active={phase}
        phaseMix={phaseMix}
        dyingMix={dyingMix}
        onPhaseChange={onPhaseChange}
      />
    </div>
  );
}
