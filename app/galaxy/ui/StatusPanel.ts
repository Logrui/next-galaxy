import { Panel } from './base/Panel';
import { PathMode, PATH_LABELS } from './createPathPanel';

interface StatusPanelOptions {
  getPhaseMix(): number; // 1 = Nebula, 0 = Galaxy
  getDyingMix(): number; // dying star collapse amount
  getFromPath(): PathMode;
  getToPath(): PathMode;
  getPathMix(): number; // 0..1 interpolation between from/to
}

/**
 * Status panel displaying current galaxy phase and path transition state.
 */
export class StatusPanel extends Panel {
  private options: StatusPanelOptions;
  private phaseEl: HTMLDivElement | null = null;
  private pathEl: HTMLDivElement | null = null;
  private progEl: HTMLDivElement | null = null;

  constructor(container: HTMLElement, options: StatusPanelOptions) {
    super(container);
    this.options = options;
    this.update({});
  }

  protected createElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="font-weight:bold; letter-spacing:.5px; margin-bottom:8px; font-size: 13px;">Galaxy Status</div>
      <div data-phase></div>
      <div data-path></div>
      <div data-progress style="font-size:10px; opacity:.75; margin-top:6px;"></div>
    `;

    this.phaseEl = el.querySelector('[data-phase]') as HTMLDivElement;
    this.pathEl = el.querySelector('[data-path]') as HTMLDivElement;
    this.progEl = el.querySelector('[data-progress]') as HTMLDivElement;

    return el;
  }

  protected setupStyles(): void {
    super.setupStyles();
    this.element.style.top = '160px'; // Below PhasePanel (20 + ~120 height + 20 gap)
    this.element.style.right = '20px';
    this.element.style.minWidth = '200px';
    this.element.style.maxWidth = '420px';
    this.element.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";
    this.element.style.fontSize = '12px';
    this.element.style.letterSpacing = '0.02em';
    this.element.style.pointerEvents = 'none';
    this.element.style.userSelect = 'none';
  }

  /**
   * Derives human-readable phase label from phaseMix and dyingMix values.
   */
  private getPhaseLabel(phaseMix: number, dyingMix: number): string {
    const basePhase = phaseMix > 0.5 ? 'Nebula' : 'Galaxy';
    if (dyingMix > 0.6) return 'Dying Star';
    if (dyingMix > 0.1) return `Collapse ${(dyingMix * 100).toFixed(0)}%`;
    return basePhase;
  }

  /**
   * Updates the status panel display with current phase and path information.
   * @param _data Optional data object (not used, reads from options).
   */
  update(_data: unknown): void {
    if (!this.phaseEl || !this.pathEl || !this.progEl) return;

    const pm = this.options.getPhaseMix();
    const dm = this.options.getDyingMix();
    const fp = this.options.getFromPath();
    const tp = this.options.getToPath();
    const mx = this.options.getPathMix();

    const phaseText = this.getPhaseLabel(pm, dm);
    const samePath = fp === tp;

    this.phaseEl.textContent = `Phase: ${phaseText} (mix ${(pm * 100).toFixed(0)}%)`;

    if (samePath) {
      this.pathEl.textContent = `Path: ${PATH_LABELS[tp]}`;
      this.progEl.textContent = '';
    } else {
      this.pathEl.textContent = `Path: ${PATH_LABELS[fp]} → ${PATH_LABELS[tp]}`;
      this.progEl.textContent = `Transition ${(mx * 100).toFixed(0)}%`;
    }
  }
}

