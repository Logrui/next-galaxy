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
import { CAMERA_PRESETS, applyCameraPreset } from './location_presets';
import { createCameraAnimator, CameraAnimator } from './camera_animator';

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

    // Create camera position display
    const cameraInfo = document.createElement('div');
    cameraInfo.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.4;
      pointer-events: none;
      z-index: 1000;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    cameraInfo.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Camera Position</div>
      <div>X: <span id="cam-x">59.3</span></div>
      <div>Y: <span id="cam-y">196.0</span></div>
      <div>Z: <span id="cam-z">355.0</span></div>
      <div style="font-weight: bold; margin: 8px 0 5px 0;">Camera Target</div>
      <div>X: <span id="target-x">0.0</span></div>
      <div>Y: <span id="target-y">0.0</span></div>
      <div>Z: <span id="target-z">0.0</span></div>
    `;
    el.appendChild(cameraInfo);
    cameraInfoRef.current = cameraInfo;

    // Create camera preset buttons
    const presetButtons = document.createElement('div');
    presetButtons.style.cssText = `
      position: absolute;
      top: 20px;
      left: 200px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const buttonsHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Camera Presets</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        ${CAMERA_PRESETS.map((preset, index) => `
          <button 
            id="preset-${index}" 
            style="
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: white;
              padding: 4px 8px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 10px;
              font-family: monospace;
            "
            title="${preset.description}"
          >
            ${preset.name}
          </button>
        `).join('')}
      </div>
    `;
    
    presetButtons.innerHTML = buttonsHTML;
    el.appendChild(presetButtons);
    presetButtonsRef.current = presetButtons;

    // Add click handlers for preset buttons
    CAMERA_PRESETS.forEach((preset, index) => {
      const button = presetButtons.querySelector(`#preset-${index}`);
      if (button) {
        button.addEventListener('click', () => {
          // Use smooth animation instead of instant teleport
          cameraAnimator.animateWithStyle(preset, 'smooth');
        });
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
          (button as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
        });
        button.addEventListener('mouseleave', () => {
          (button as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
        });
      }
    });

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

    // Uniforms (ported from app.js)
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
      nebula: { value: true },
      focalDistance: { value: 385 },
      aperture: { value: 500 }, // Default aperture value
      maxParticleSize: { value: 8 },
      tint: { value: new THREE.Color('#fff') },
      glow: { value: false },
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
      nebulaAmp: { value: 1.5 }, // Reduced from 5 to make particles wiggle less
    };

    const material = new THREE.RawShaderMaterial({
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
    const s = new Float32Array(Im * 3);
    const e = 300;
    for (let r = 0; r < Im; r++) {
      const o = r * 3;
      s[o] = random.range(-e, e);
      s[o + 1] = random.range(-e, e);
      s[o + 2] = random.range(-e, e);
    }
    const t = new Float32Array(Im * 2);
    let n = 0;
    for (let r = 0; r < 128; r++) {
      for (let o = 0; o < 256; o++) {
        t[n * 2] = 1 / 256 + o / 257;
        t[n * 2 + 1] = 1 / 128 + r / 129;
        n++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(s, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(t, 2));

    const points = new THREE.Points(geo, material);
    points.rotation.x = Math.PI / 2;
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
    gui.add(settings, 'glow').onChange((value: boolean) => {
      // This is handled in the render loop, but we keep it for visual feedback
    });
    gui.add(settings, 'nebulaAmp', 0, 10, 0.1).onChange((value: number) => {
      uniforms.nebulaAmp.value = value;
    });

    // Depth of Field controls
    const dofFolder = gui.addFolder('Depth of Field');
    dofFolder.add(settings, 'focalDistance', 50, 1000, 1).onChange((value: number) => {
      uniforms.focalDistance.value = value;
    });
    dofFolder.add(settings, 'aperture', 0, 10000, 1).onChange((value: number) => {
      uniforms.aperture.value = value;
    });

    // Camera position controls
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

    // Camera target controls
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
      animate();
    });

    // Mouse interaction using simple-input-events (like original)
    const inputEvents = createInputEvents(renderer.domElement);
    
    inputEvents.on('move', ({ position, event, inside, dragging }) => {
      const [x, y] = position;
      
      // Convert to normalized device coordinates
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

      // Update real-time camera position and target display
      const camX = Math.round(camera.position.x * 10) / 10;
      const camY = Math.round(camera.position.y * 10) / 10;
      const camZ = Math.round(camera.position.z * 10) / 10;
      
      const targetX = Math.round(controls.target.x * 10) / 10;
      const targetY = Math.round(controls.target.y * 10) / 10;
      const targetZ = Math.round(controls.target.z * 10) / 10;
      
      if (cameraInfoRef.current) {
        // Update position
        const xSpan = cameraInfoRef.current.querySelector('#cam-x');
        const ySpan = cameraInfoRef.current.querySelector('#cam-y');
        const zSpan = cameraInfoRef.current.querySelector('#cam-z');
        if (xSpan) xSpan.textContent = camX.toString();
        if (ySpan) ySpan.textContent = camY.toString();
        if (zSpan) zSpan.textContent = camZ.toString();
        
        // Update target
        const targetXSpan = cameraInfoRef.current.querySelector('#target-x');
        const targetYSpan = cameraInfoRef.current.querySelector('#target-y');
        const targetZSpan = cameraInfoRef.current.querySelector('#target-z');
        if (targetXSpan) targetXSpan.textContent = targetX.toString();
        if (targetYSpan) targetYSpan.textContent = targetY.toString();
        if (targetZSpan) targetZSpan.textContent = targetZ.toString();
      }

      // Update GUI settings (for manual control)
      settings.cameraX = camX;
      settings.cameraY = camY;
      settings.cameraZ = camZ;
      settings.targetX = targetX;
      settings.targetY = targetY;
      settings.targetZ = targetZ;

      // Update uniforms from GUI
      uniforms.fdAlpha.value = settings.fdAlpha;
      uniforms.superScale.value = settings.superScale;

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
      if (cameraInfoRef.current && el.contains(cameraInfoRef.current)) {
        el.removeChild(cameraInfoRef.current);
      }
      if (presetButtonsRef.current && el.contains(presetButtonsRef.current)) {
        el.removeChild(presetButtonsRef.current);
      }
    };
  }, [isClient]);

  if (!isClient) {
    return <div style={{ width: '100%', height: '100vh', background: '#000' }} />;
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100vh', background: '#000' }} />;
}
