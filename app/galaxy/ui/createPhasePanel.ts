// Phase panel encapsulating Nebula / Galaxy / Dying Star buttons and animation helpers.
// Returns API with setPhase(target) and destroy().
// Keeps original easing & timing semantics from legacy inline implementation.

export type PhaseName = 'nebula' | 'galaxy' | 'dying';

export interface PhasePanelAPI {
  element: HTMLDivElement;
  setPhase(target: PhaseName): void;
  destroy(): void;
}

interface PhasePanelOptions {
  container: HTMLElement;
  getPhaseMix(): number;
  getDyingMix(): number;
  animatePhase: (targetValue: number, duration?: number) => void;
  animateDying: (targetValue: number, duration?: number) => void;
}

export function createPhasePanel(opts: PhasePanelOptions): PhasePanelAPI {
  const { container, getPhaseMix, getDyingMix, animatePhase, animateDying } = opts;
  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute;
    top: 20px;
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 10px 14px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px solid rgba(255,255,255,0.2);
    min-width: 140px;
    transition: left .25s ease;
  `;
  el.innerHTML = `
    <div style="font-weight:bold;">Phase</div>
    <div style="display:flex; gap:6px;">
      <button data-phase="nebula" style="flex:1; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.35); color:#fff; padding:4px 6px; border-radius:3px; cursor:pointer; font-size:11px;">Nebula</button>
      <button data-phase="galaxy" style="flex:1; background:rgba(120,160,255,0.35); box-shadow:0 0 0 1px rgba(140,170,255,0.6) inset; border:1px solid rgba(255,255,255,0.35); color:#fff; padding:4px 6px; border-radius:3px; cursor:pointer; font-size:11px;">Galaxy</button>
      <button data-phase="dying" style="flex:1; background:linear-gradient(135deg, rgba(255,140,120,0.35), rgba(180,60,255,0.35)); border:1px solid rgba(255,255,255,0.45); color:#fff; padding:4px 6px; border-radius:3px; cursor:pointer; font-size:11px;">Dying Star</button>
    </div>
    <div data-status style="opacity:.8; font-size:10px; letter-spacing:.5px;">Active: Galaxy (phaseMix=1, dyingMix=0)</div>
  `;
  container.appendChild(el);

  const buttons = Array.from(el.querySelectorAll('button[data-phase]')) as HTMLButtonElement[];
  const statusEl = el.querySelector('[data-status]') as HTMLDivElement | null;

  function updateStatus() {
    if (!statusEl) return;
    const pm = getPhaseMix().toFixed(2);
    const dm = getDyingMix().toFixed(2);
    const active = buttons.find(b => b.dataset.active === 'true');
    statusEl.textContent = `Active: ${active?.textContent || 'Galaxy'} (phaseMix=${pm}, dyingMix=${dm})`;
  }

  function highlight(target: PhaseName) {
    buttons.forEach(btn => {
      btn.style.boxShadow = 'none';
      if (btn.dataset.phase === 'dying') {
        btn.style.background = 'linear-gradient(135deg, rgba(255,140,120,0.35), rgba(180,60,255,0.35))';
      } else {
        btn.style.background = 'rgba(255,255,255,0.12)';
      }
      btn.dataset.active = 'false';
    });
    const activeBtn = buttons.find(b => b.dataset.phase === target);
    if (activeBtn) {
      activeBtn.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.7) inset';
      if (target !== 'dying') activeBtn.style.background = 'rgba(120,160,255,0.45)';
      activeBtn.dataset.active = 'true';
    }
    updateStatus();
  }

  function setPhase(target: PhaseName) {
    if (target === 'nebula') {
      animateDying(0.0, 900);
      animatePhase(1.0, 1500); // legacy mapping: 1 = Nebula
    } else if (target === 'galaxy') {
      animateDying(0.0, 900);
      animatePhase(0.0, 1500); // 0 = Galaxy
    } else {
      animatePhase(0.0, 1200);
      animateDying(1.0, 1800);
    }
    highlight(target);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const phase = (btn.dataset.phase || 'galaxy') as PhaseName;
      setPhase(phase);
    });
  });

  // Initialize default highlight (Galaxy path active visually but status logic legacy had Nebula btn look alternative)
  highlight('nebula');

  function destroy() {
    buttons.forEach(b => b.replaceWith(b.cloneNode(true)));
    if (el.parentElement === container) container.removeChild(el);
  }

  return { element: el, setPhase, destroy };
}
