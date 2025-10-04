import { Panel } from './base/Panel';

export type PathMode =
  | 0 | 1 | 3 | 4 | 5 | 6
  | 8 | 10 | 11 | 12 | 15;

export const PATH_LABELS: Record<PathMode, string> = {
  0: 'Base',
  1: 'Spiral',
  3: 'Jets',
  4: 'Vortex',
  5: 'Crystal Weave',
  6: 'Chrono Streams',
  8: 'Lunar Halo Drift',
  10: 'Tidal Stream Bands',
  11: 'Pillar Glow Columns',
  12: 'Lagoon Mist Sheet',
  15: 'Ice Coma Bloom'
};

interface PathPanelOptions {
  getMode(): PathMode;
  setMode(mode: PathMode): void;
}

/**
 * Path variants panel allowing selection of different particle path modes.
 */
export class PathPanel extends Panel {
  private buttons: HTMLButtonElement[] = [];
  private statusEl: HTMLDivElement | null = null;
  private options: PathPanelOptions;

  constructor(container: HTMLElement, options: PathPanelOptions) {
    super(container);
    this.options = options;
    this.refresh();
  }

  protected createElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="font-weight:bold; letter-spacing:.5px; margin-bottom: 8px; font-size: 13px;">Path Variants</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; max-width:340px;">
        <button data-mode="0" style="flex:1 1 45%; padding:6px 8px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.35); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Base</button>
        <button data-mode="1" style="flex:1 1 45%; padding:6px 8px; background:rgba(40,140,255,0.25); border:1px solid rgba(120,180,255,0.55); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Spiral</button>
        <button data-mode="3" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(135deg, rgba(255,120,70,0.35), rgba(255,225,120,0.3)); border:1px solid rgba(255,170,110,0.55); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Jets</button>
        <button data-mode="4" style="flex:1 1 45%; padding:6px 8px; background:rgba(120,255,255,0.18); border:1px solid rgba(140,255,255,0.45); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Vortex</button>
        <button data-mode="5" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(135deg, rgba(200,255,245,0.2), rgba(140,220,255,0.2)); border:1px solid rgba(200,255,240,0.5); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Crystal Weave</button>
        <button data-mode="6" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(135deg, rgba(255,160,240,0.3), rgba(120,200,255,0.25)); border:1px solid rgba(220,150,255,0.55); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Chrono Streams</button>
        <button data-mode="8" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(135deg, rgba(180,210,255,0.18), rgba(220,255,255,0.18)); border:1px solid rgba(200,220,255,0.45); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Lunar Halo Drift</button>
        <button data-mode="10" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(135deg, rgba(150,210,255,0.18), rgba(200,255,255,0.18)); border:1px solid rgba(160,220,255,0.45); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Tidal Stream Bands</button>
        <button data-mode="11" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(180deg, rgba(200,160,255,0.16), rgba(120,180,255,0.16)); border:1px solid rgba(190,150,255,0.45); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Pillar Glow Columns</button>
        <button data-mode="12" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(135deg, rgba(140,200,255,0.18), rgba(100,160,220,0.22)); border:1px solid rgba(120,190,255,0.45); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Lagoon Mist Sheet</button>
        <button data-mode="15" style="flex:1 1 45%; padding:6px 8px; background:linear-gradient(135deg, rgba(200,240,255,0.22), rgba(160,200,255,0.22)); border:1px solid rgba(180,220,255,0.45); color:#fff; border-radius:4px; cursor:pointer; font-size:11px; transition: all 150ms ease;">Ice Coma Bloom</button>
      </div>
      <div data-status style="font-size:10px; opacity:.8; margin-top: 8px;">Mode: Base</div>
    `;

    this.buttons = Array.from(el.querySelectorAll('button[data-mode]')) as HTMLButtonElement[];
    this.statusEl = el.querySelector('[data-status]') as HTMLDivElement | null;

    // Set button titles
    this.buttons.forEach((b) => {
      const mode = Number(b.dataset.mode) as PathMode;
      const label = PATH_LABELS[mode];
      if (label) b.title = label;
    });

    return el;
  }

  protected setupStyles(): void {
    super.setupStyles();
    // Left side, below PresetButtonsPanel
    this.element.style.top = '380px';
    this.element.style.left = '20px';
    this.element.style.minWidth = '340px';
    this.element.style.fontFamily = "'monospace'";
    this.element.style.fontSize = '12px';
  }

  protected setupEventListeners(): void {
    this.buttons.forEach(b => {
      b.addEventListener('click', () => {
        const m = Number(b.dataset.mode) as PathMode;
        if (m === this.options.getMode()) return;
        this.options.setMode(m);
        this.refresh();
      });
    });
  }

  /**
   * Refreshes the panel highlighting based on current mode.
   */
  private refresh(): void {
    const mode = this.options.getMode();

    // Fallback if an old/removed mode is somehow active
    if (!(mode in PATH_LABELS)) {
      this.options.setMode(0);
    }

    this.buttons.forEach(b => {
      b.style.outline = 'none';
      b.style.boxShadow = 'none';
      if (Number(b.dataset.mode) === mode) {
        b.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.8) inset';
      }
    });

    if (this.statusEl) {
      this.statusEl.textContent = `Mode: ${PATH_LABELS[mode]}`;
    }
  }

  /**
   * Sets the path mode and refreshes the display.
   * @param mode Path mode to set.
   */
  setMode(mode: PathMode): void {
    this.options.setMode(mode);
    this.refresh();
  }

  /**
   * Updates the panel (refreshes highlighting).
   * @param _data Optional data object (not used).
   */
  update(_data: unknown): void {
    this.refresh();
  }
}

