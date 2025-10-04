import { Panel } from './base/Panel';

export type PhaseName = 'nebula' | 'galaxy' | 'dying';

interface PhasePanelOptions {
  getPhaseMix(): number;
  getDyingMix(): number;
  animatePhase: (targetValue: number, duration?: number) => void;
  animateDying: (targetValue: number, duration?: number) => void;
}

/**
 * Phase selection panel for switching between Nebula, Galaxy, and Dying Star phases.
 */
export class PhasePanel extends Panel {
  private buttons: HTMLButtonElement[] = [];
  private statusEl: HTMLDivElement | null = null;
  private options: PhasePanelOptions;

  constructor(container: HTMLElement, options: PhasePanelOptions) {
    super(container);
    this.options = options;
    // Initialize default highlight
    this.highlight('nebula');
  }

  protected createElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="font-weight:bold; margin-bottom: 8px; font-size: 13px;">Phase</div>
      <div style="display:flex; gap:8px;">
        <button data-phase="nebula" style="flex:1; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.35); color:#fff; padding:6px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Nebula</button>
        <button data-phase="galaxy" style="flex:1; background:rgba(120,160,255,0.35); box-shadow:0 0 0 1px rgba(140,170,255,0.6) inset; border:1px solid rgba(255,255,255,0.35); color:#fff; padding:6px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Galaxy</button>
        <button data-phase="dying" style="flex:1; background:linear-gradient(135deg, rgba(255,140,120,0.35), rgba(180,60,255,0.35)); border:1px solid rgba(255,255,255,0.45); color:#fff; padding:6px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Dying Star</button>
      </div>
      <div data-status style="opacity:.8; font-size:10px; letter-spacing:.5px; margin-top: 8px;">Active: Galaxy (phaseMix=1, dyingMix=0)</div>
    `;

    this.buttons = Array.from(el.querySelectorAll('button[data-phase]')) as HTMLButtonElement[];
    this.statusEl = el.querySelector('[data-status]') as HTMLDivElement | null;

    return el;
  }

  protected setupStyles(): void {
    super.setupStyles();
    // Right side, top position
    this.element.style.top = '20px';
    this.element.style.right = '20px';
    this.element.style.minWidth = '420px';
    this.element.style.maxWidth = '420px';
    this.element.style.fontFamily = "'monospace'";
    this.element.style.fontSize = '12px';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.gap = '8px';
  }

  protected setupEventListeners(): void {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const phase = (btn.dataset.phase || 'galaxy') as PhaseName;
        this.setPhase(phase);
      });
    });
  }

  /**
   * Sets the active phase and triggers animations.
   * @param target Phase name ('nebula', 'galaxy', or 'dying').
   */
  setPhase(target: PhaseName): void {
    const { animateDying, animatePhase } = this.options;

    if (target === 'nebula') {
      animateDying(0.0, 900);
      animatePhase(1.0, 1500); // 1 = Nebula
    } else if (target === 'galaxy') {
      animateDying(0.0, 900);
      animatePhase(0.0, 1500); // 0 = Galaxy
    } else {
      animatePhase(0.0, 1200);
      animateDying(1.0, 1800);
    }

    this.highlight(target);
  }

  /**
   * Highlights the active phase button.
   */
  private highlight(target: PhaseName): void {
    this.buttons.forEach(btn => {
      btn.style.boxShadow = 'none';
      if (btn.dataset.phase === 'dying') {
        btn.style.background = 'linear-gradient(135deg, rgba(255,140,120,0.35), rgba(180,60,255,0.35))';
      } else {
        btn.style.background = 'rgba(255,255,255,0.12)';
      }
      btn.dataset.active = 'false';
    });

    const activeBtn = this.buttons.find(b => b.dataset.phase === target);
    if (activeBtn) {
      activeBtn.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.7) inset';
      if (target !== 'dying') activeBtn.style.background = 'rgba(120,160,255,0.45)';
      activeBtn.dataset.active = 'true';
    }

    this.updateStatus();
  }

  /**
   * Updates the status text display.
   */
  private updateStatus(): void {
    if (!this.statusEl) return;

    const pm = this.options.getPhaseMix().toFixed(2);
    const dm = this.options.getDyingMix().toFixed(2);
    const active = this.buttons.find(b => b.dataset.active === 'true');
    this.statusEl.textContent = `Active: ${active?.textContent || 'Galaxy'} (phaseMix=${pm}, dyingMix=${dm})`;
  }

  /**
   * Updates the panel status display.
   * @param _data Optional data object (not used, but required by base class).
   */
  update(_data: unknown): void {
    this.updateStatus();
  }
}

