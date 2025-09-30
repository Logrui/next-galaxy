import * as THREE from 'three';
import createInputEvents from 'simple-input-events';

interface CreateInteractionOptions {
  element: HTMLElement;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  pointer: THREE.Vector2;
  raycaster: THREE.Raycaster;
  invisiblePlane: THREE.Object3D;
  debugSphere: THREE.Mesh;
  uniforms: { [key: string]: any };
}

export function createInteraction(opts: CreateInteractionOptions) {
  const { renderer, camera, pointer, raycaster, invisiblePlane, debugSphere, uniforms, element } = opts;
  const inputEvents = createInputEvents(renderer.domElement);

  inputEvents.on('move', ({ position }) => {
    const [x, y] = position;
    pointer.x = (x / element.clientWidth) * 2 - 1;
    pointer.y = -(y / element.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(invisiblePlane);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      uniforms.interaction.value.x = point.x;
      uniforms.interaction.value.y = point.y;
      uniforms.interaction.value.z = point.z;
      uniforms.interaction.value.w = 1;
      debugSphere.position.copy(point);
    }
  });

  function dispose(){
    inputEvents.dispose();
  }

  return { dispose };
}