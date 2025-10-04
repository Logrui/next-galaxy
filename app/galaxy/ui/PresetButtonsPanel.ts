import { Panel } from './base/Panel';
import { CAMERA_PRESETS } from '../location_presets';
import { CameraAnimator } from '../camera_animator';

/**
 * Camera preset buttons panel allowing quick navigation to predefined camera positions.
 */
export class PresetButtonsPanel extends Panel {
  private buttons: HTMLButtonElement[] = [];
  private animator: CameraAnimator;

  constructor(container: HTMLElement, animator: CameraAnimator) {
    super(container);
    this.animator = animator;
  }

  protected createElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; font-size: 13px;">Camera Presets</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        ${CAMERA_PRESETS.map((preset, index) => `
          <button
            data-preset="${index}"
            style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color:white; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-family: monospace; transition: background 150ms ease;"
            title="${preset.description}"
          >${preset.name}</button>`).join('')}
      </div>
    `;

    // Cache button references
    this.buttons = Array.from(el.querySelectorAll('button[data-preset]')) as HTMLButtonElement[];

    return el;
  }

  protected setupStyles(): void {
    super.setupStyles();
    // Left side, below CameraInfoPanel
    this.element.style.top = '200px';
    this.element.style.left = '20px';
    this.element.style.minWidth = '240px';
    this.element.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";
    this.element.style.fontSize = '12px';
    this.element.style.letterSpacing = '0.02em';
  }

  protected setupEventListeners(): void {
    this.buttons.forEach(btn => {
      const clickHandler = () => {
        const idx = parseInt(btn.dataset.preset || '0', 10);
        this.animator.animateWithStyle(CAMERA_PRESETS[idx], 'smooth');
      };
      const hoverInHandler = () => { btn.style.background = 'rgba(255,255,255,0.22)'; };
      const hoverOutHandler = () => { btn.style.background = 'rgba(255,255,255,0.1)'; };

      btn.addEventListener('click', clickHandler);
      btn.addEventListener('mouseenter', hoverInHandler);
      btn.addEventListener('mouseleave', hoverOutHandler);
    });
  }

  /**
   * Updates the panel (preset panels generally don't need dynamic updates).
   * @param _data Optional data object (not used).
   */
  update(_data: unknown): void {
    // No-op for this panel type
  }
}

