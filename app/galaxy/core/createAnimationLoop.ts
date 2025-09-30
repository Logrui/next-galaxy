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
  cameraInfoAPI?: { update: (camera: THREE.PerspectiveCamera, controls: any) => void };
}

export function createAnimationLoop(opts: CreateAnimationLoopOptions){
  const { uniforms, renderer, scene, camera, material, settings, cameraInfoElement, controls, cameraInfoAPI } = opts;
  let running = true;

  function updateCameraInfo(){
    if(cameraInfoAPI){
      cameraInfoAPI.update(camera, controls);
      // also mirror into settings for GUI if present
      settings.cameraX = Math.round(camera.position.x * 10) / 10;
      settings.cameraY = Math.round(camera.position.y * 10) / 10;
      settings.cameraZ = Math.round(camera.position.z * 10) / 10;
      settings.targetX = Math.round(controls.target.x * 10) / 10;
      settings.targetY = Math.round(controls.target.y * 10) / 10;
      settings.targetZ = Math.round(controls.target.z * 10) / 10;
      return;
    }
    if(!cameraInfoElement) return;
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