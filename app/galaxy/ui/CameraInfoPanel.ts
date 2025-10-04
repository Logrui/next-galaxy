import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Panel } from './base/Panel';

/**
 * Camera information overlay panel displaying camera position and target coordinates.
 */
export class CameraInfoPanel extends Panel {
  private spans: {
    camX: HTMLSpanElement;
    camY: HTMLSpanElement;
    camZ: HTMLSpanElement;
    targetX: HTMLSpanElement;
    targetY: HTMLSpanElement;
    targetZ: HTMLSpanElement;
  } | null = null;

  protected createElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">Camera Position</div>
      <div style="margin-left: 8px;">
        <div>X: <span data-cam-x>0</span></div>
        <div>Y: <span data-cam-y>0</span></div>
        <div>Z: <span data-cam-z>0</span></div>
      </div>
      <div style="font-weight: bold; margin: 12px 0 8px 0; font-size: 13px;">Camera Target</div>
      <div style="margin-left: 8px;">
        <div>X: <span data-target-x>0</span></div>
        <div>Y: <span data-target-y>0</span></div>
        <div>Z: <span data-target-z>0</span></div>
      </div>
    `;

    // Cache span references for efficient updates
    this.spans = {
      camX: el.querySelector('[data-cam-x]') as HTMLSpanElement,
      camY: el.querySelector('[data-cam-y]') as HTMLSpanElement,
      camZ: el.querySelector('[data-cam-z]') as HTMLSpanElement,
      targetX: el.querySelector('[data-target-x]') as HTMLSpanElement,
      targetY: el.querySelector('[data-target-y]') as HTMLSpanElement,
      targetZ: el.querySelector('[data-target-z]') as HTMLSpanElement,
    };

    return el;
  }

  protected setupStyles(): void {
    super.setupStyles();
    // Left side, top position
    this.element.style.top = '20px';
    this.element.style.left = '20px';
    this.element.style.minWidth = '200px';
    this.element.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";
    this.element.style.fontSize = '12px';
    this.element.style.letterSpacing = '0.02em';
  }

  /**
   * Updates the camera info display with current camera and controls data.
   * @param data Object containing camera and controls.
   */
  update(data: unknown): void {
    if (typeof data !== 'object' || data === null || !('camera' in data) || !('controls' in data)) return;
    if (!this.spans) return;

    const { camera, controls } = data as { camera: THREE.PerspectiveCamera; controls: OrbitControls };

    // Round to 1 decimal place for readability
    const rx = Math.round(camera.position.x * 10) / 10;
    const ry = Math.round(camera.position.y * 10) / 10;
    const rz = Math.round(camera.position.z * 10) / 10;
    const tx = Math.round(controls.target.x * 10) / 10;
    const ty = Math.round(controls.target.y * 10) / 10;
    const tz = Math.round(controls.target.z * 10) / 10;

    this.spans.camX.textContent = rx.toString();
    this.spans.camY.textContent = ry.toString();
    this.spans.camZ.textContent = rz.toString();
    this.spans.targetX.textContent = tx.toString();
    this.spans.targetY.textContent = ty.toString();
    this.spans.targetZ.textContent = tz.toString();
  }
}

