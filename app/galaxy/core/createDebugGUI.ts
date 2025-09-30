import GUI from 'lil-gui';
import * as THREE from 'three';

interface CreateDebugGUIOptions {
  uniforms: { [key: string]: any };
  camera: THREE.PerspectiveCamera;
  controls: any; // OrbitControls type avoided to prevent extra import chain
}

export function createDebugGUI({ uniforms, camera, controls }: CreateDebugGUIOptions) {
  const gui = new GUI();
  const settings = {
    progress: 0,
    fdAlpha: 0,
    superScale: 1,
    glow: false,
    nebulaAmp: uniforms.nebulaAmp.value as number,
    cameraX: camera.position.x,
    cameraY: camera.position.y,
    cameraZ: camera.position.z,
    targetX: controls.target.x,
    targetY: controls.target.y,
    targetZ: controls.target.z,
    focalDistance: uniforms.focalDistance.value as number,
    aperture: uniforms.aperture.value as number,
  };

  gui.add(settings, 'progress', 0, 1, 0.01).onChange((v: number) => uniforms.fade.value = v);
  gui.add(settings, 'fdAlpha', 0, 1, 0.01).onChange((v: number) => uniforms.fdAlpha.value = v);
  gui.add(settings, 'superScale', 0, 3, 0.01).onChange((v: number) => uniforms.superScale.value = v);
  gui.add(settings, 'glow');
  gui.add(settings, 'nebulaAmp', 0, 10, 0.1).onChange((v: number) => uniforms.nebulaAmp.value = v);

  const dofFolder = gui.addFolder('Depth of Field');
  dofFolder.add(settings, 'focalDistance', 50, 1000, 1).onChange((v: number) => uniforms.focalDistance.value = v);
  dofFolder.add(settings, 'aperture', 0, 10000, 1).onChange((v: number) => uniforms.aperture.value = v);

  const cameraFolder = gui.addFolder('Camera Position');
  cameraFolder.add(settings, 'cameraX', -1000, 1000, 1).onChange((v: number) => camera.position.x = v);
  cameraFolder.add(settings, 'cameraY', -1000, 1000, 1).onChange((v: number) => camera.position.y = v);
  cameraFolder.add(settings, 'cameraZ', -1000, 1000, 1).onChange((v: number) => camera.position.z = v);

  const targetFolder = gui.addFolder('Camera Target');
  targetFolder.add(settings, 'targetX', -1000, 1000, 1).onChange((v: number) => { controls.target.x = v; controls.update(); });
  targetFolder.add(settings, 'targetY', -1000, 1000, 1).onChange((v: number) => { controls.target.y = v; controls.update(); });
  targetFolder.add(settings, 'targetZ', -1000, 1000, 1).onChange((v: number) => { controls.target.z = v; controls.update(); });

  function dispose(){
    gui.destroy();
  }
  return { gui, settings, dispose };
}