import * as THREE from 'three';

interface CreateAnimationLoopOptions {
  uniforms: { [key: string]: any };
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  material: THREE.RawShaderMaterial;
  settings: any; // from debug GUI
  cameraInfoElement: HTMLElement | null;
  controls: any; // OrbitControls
}

export function createAnimationLoop(opts: CreateAnimationLoopOptions){
  const { uniforms, renderer, scene, camera, material, settings, cameraInfoElement, controls } = opts;
  let running = true;

  function updateCameraInfo(){
    if(!cameraInfoElement) return;
    const camX = Math.round(camera.position.x * 10) / 10;
    const camY = Math.round(camera.position.y * 10) / 10;
    const camZ = Math.round(camera.position.z * 10) / 10;
    const targetX = Math.round(controls.target.x * 10) / 10;
    const targetY = Math.round(controls.target.y * 10) / 10;
    const targetZ = Math.round(controls.target.z * 10) / 10;
    const xSpan = cameraInfoElement.querySelector('#cam-x');
    const ySpan = cameraInfoElement.querySelector('#cam-y');
    const zSpan = cameraInfoElement.querySelector('#cam-z');
    if (xSpan) xSpan.textContent = camX.toString();
    if (ySpan) ySpan.textContent = camY.toString();
    if (zSpan) zSpan.textContent = camZ.toString();
    const targetXSpan = cameraInfoElement.querySelector('#target-x');
    const targetYSpan = cameraInfoElement.querySelector('#target-y');
    const targetZSpan = cameraInfoElement.querySelector('#target-z');
    if (targetXSpan) targetXSpan.textContent = targetX.toString();
    if (targetYSpan) targetYSpan.textContent = targetY.toString();
    if (targetZSpan) targetZSpan.textContent = targetZ.toString();
    // synchronize settings back for GUI display
    settings.cameraX = camX; settings.cameraY = camY; settings.cameraZ = camZ;
    settings.targetX = targetX; settings.targetY = targetY; settings.targetZ = targetZ;
  }

  function frame(){
    if(!running) return;
    uniforms.time.value += 0.05;
    updateCameraInfo();
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
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  function stop(){ running = false; }
  return { stop };
}