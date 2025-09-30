// Creates camera preset buttons panel and wires them to a provided animator.
// Returns element and destroy() cleanup.

import { CAMERA_PRESETS } from '../location_presets';
import { CameraAnimator } from '../camera_animator';

export interface PresetButtonsPanel {
  element: HTMLDivElement;
  destroy(): void;
}

export function createPresetButtons(container: HTMLElement, animator: CameraAnimator): PresetButtonsPanel {
  const el = document.createElement('div');
  el.style.cssText = `
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
  el.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">Camera Presets</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
      ${CAMERA_PRESETS.map((preset, index) => `
        <button
          data-preset="${index}"
          style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color:white; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:10px; font-family: monospace;"
          title="${preset.description}"
        >${preset.name}</button>`).join('')}
    </div>
  `;
  container.appendChild(el);

  const buttons = Array.from(el.querySelectorAll('button[data-preset]')) as HTMLButtonElement[];
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.preset || '0', 10);
      animator.animateWithStyle(CAMERA_PRESETS[idx], 'smooth');
    });
    btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.1)'; });
  });

  function destroy() {
    buttons.forEach(btn => btn.replaceWith(btn.cloneNode(true))); // remove listeners via clone
    if (el.parentElement === container) container.removeChild(el);
  }

  return { element: el, destroy };
}
