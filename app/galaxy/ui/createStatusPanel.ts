import { PathMode, PATH_LABELS } from './createPathPanel';

export interface StatusPanelAPI {
  element: HTMLDivElement;
  destroy(): void;
  update(): void;
}

interface CreateStatusPanelOptions {
  container: HTMLElement;
  getPhaseMix(): number; // 1 = Nebula, 0 = Galaxy
  getDyingMix(): number; // dying star collapse amount
  getFromPath(): PathMode;
  getToPath(): PathMode;
  getPathMix(): number; // 0..1 interpolation between from/to
}

const PHASE_LABEL = (phaseMix: number, dyingMix: number) => {
  // Derive human-readable phase state
  const basePhase = phaseMix > 0.5 ? 'Nebula' : 'Galaxy';
  if (dyingMix > 0.6) return 'Dying Star';
  if (dyingMix > 0.1) return `Collapse ${(dyingMix*100).toFixed(0)}%`;
  return basePhase;
};

export function createStatusPanel(opts: CreateStatusPanelOptions): StatusPanelAPI {
  const { container, getPhaseMix, getDyingMix, getFromPath, getToPath, getPathMix } = opts;
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute; top:20px; right:400px; z-index:1100;
    background:rgba(0,0,0,0.6); padding:10px 14px; border:1px solid rgba(255,255,255,0.25);
    font-family:monospace; font-size:12px; color:#fff; min-width:180px; line-height:1.4;
    border-radius:6px; backdrop-filter:blur(6px); pointer-events:none; user-select:none;
  `;
  el.innerHTML = `
    <div style="font-weight:bold; letter-spacing:.5px; margin-bottom:6px;">Galaxy Status</div>
    <div data-phase></div>
    <div data-path></div>
    <div data-progress style="font-size:10px; opacity:.75; margin-top:4px;"></div>
  `;
  container.appendChild(el);

  const phaseEl = el.querySelector('[data-phase]') as HTMLDivElement;
  const pathEl = el.querySelector('[data-path]') as HTMLDivElement;
  const progEl = el.querySelector('[data-progress]') as HTMLDivElement;

  function update(){
    const pm = getPhaseMix();
    const dm = getDyingMix();
    const fp = getFromPath();
    const tp = getToPath();
    const mx = getPathMix();
    const phaseText = PHASE_LABEL(pm, dm);
    const samePath = fp === tp;
    phaseEl.textContent = `Phase: ${phaseText} (mix ${(pm*100).toFixed(0)}%)`;
    if(samePath){
  pathEl.textContent = `Path: ${PATH_LABELS[tp]}`;
      progEl.textContent = '';
    } else {
  pathEl.textContent = `Path: ${PATH_LABELS[fp]} -> ${PATH_LABELS[tp]}`;
      progEl.textContent = `Transition ${(mx*100).toFixed(0)}%`;
    }
  }

  update();

  function destroy(){
    if(el.parentElement === container) container.removeChild(el);
  }

  return { element: el, destroy, update };
}
