// Creates the floating camera info overlay and returns an API to update its values.
// Usage: const camInfo = createCameraInfoOverlay(container); camInfo.update(camera, controls);

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface CameraInfoOverlay {
  element: HTMLDivElement;
  update(camera: THREE.PerspectiveCamera, controls: OrbitControls): void;
  destroy(): void;
}

export function createCameraInfoOverlay(container: HTMLElement): CameraInfoOverlay {
  const el = document.createElement('div');
  el.style.cssText = `
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
  el.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">Camera Position</div>
    <div>X: <span data-cam-x>0</span></div>
    <div>Y: <span data-cam-y>0</span></div>
    <div>Z: <span data-cam-z>0</span></div>
    <div style="font-weight: bold; margin: 8px 0 5px 0;">Camera Target</div>
    <div>X: <span data-target-x>0</span></div>
    <div>Y: <span data-target-y>0</span></div>
    <div>Z: <span data-target-z>0</span></div>
  `;
  container.appendChild(el);

  const spans = {
    camX: el.querySelector('[data-cam-x]') as HTMLSpanElement,
    camY: el.querySelector('[data-cam-y]') as HTMLSpanElement,
    camZ: el.querySelector('[data-cam-z]') as HTMLSpanElement,
    targetX: el.querySelector('[data-target-x]') as HTMLSpanElement,
    targetY: el.querySelector('[data-target-y]') as HTMLSpanElement,
    targetZ: el.querySelector('[data-target-z]') as HTMLSpanElement,
  };

  function update(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    const rx = Math.round(camera.position.x * 10) / 10;
    const ry = Math.round(camera.position.y * 10) / 10;
    const rz = Math.round(camera.position.z * 10) / 10;
    const tx = Math.round(controls.target.x * 10) / 10;
    const ty = Math.round(controls.target.y * 10) / 10;
    const tz = Math.round(controls.target.z * 10) / 10;
    spans.camX.textContent = rx.toString();
    spans.camY.textContent = ry.toString();
    spans.camZ.textContent = rz.toString();
    spans.targetX.textContent = tx.toString();
    spans.targetY.textContent = ty.toString();
    spans.targetZ.textContent = tz.toString();
  }

  function destroy() {
    if (el.parentElement === container) container.removeChild(el);
  }

  return { element: el, update, destroy };
}
