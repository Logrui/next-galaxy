export type PathMode =
  | 0 | 1 | 3 | 4 | 5 | 6
  | 8 | 10 | 11 | 12 | 15; // Removed modes: 2,7,9,13,14,16,17

export const PATH_LABELS: Record<PathMode, string> = {
  0:'Base',
  1:'Spiral',
  3:'Jets',
  4:'Vortex',
  5:'Crystal Weave',
  6:'Chrono Streams',
  8:'Lunar Halo Drift',
  10:'Tidal Stream Bands',
  11:'Pillar Glow Columns',
  12:'Lagoon Mist Sheet',
  15:'Ice Coma Bloom'
};

interface CreatePathPanelOptions {
  container: HTMLElement;
  getMode(): PathMode;
  setMode(mode: PathMode): void;
}

export function createPathPanel(opts: CreatePathPanelOptions){
  const { container, getMode, setMode } = opts;
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute; top:200px; left:20px; z-index:1000; /* moved down to avoid camera overlay overlap */
    background:rgba(0,0,0,0.65); padding:10px 12px; border:1px solid rgba(255,255,255,0.25);
    border-radius:6px; font-family:monospace; font-size:12px; color:#fff;
    display:flex; flex-direction:column; gap:6px; min-width:150px; backdrop-filter:blur(4px);
  `;
  el.innerHTML = `
    <div style="font-weight:bold; letter-spacing:.5px;">Path Variants</div>
    <div style="display:flex; flex-wrap:wrap; gap:6px; max-width:320px;">
      <button data-mode="0" style="flex:1 1 45%; padding:4px 6px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.35); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Base</button>
      <button data-mode="1" style="flex:1 1 45%; padding:4px 6px; background:rgba(40,140,255,0.25); border:1px solid rgba(120,180,255,0.55); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Spiral</button>
      <button data-mode="3" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(255,120,70,0.35), rgba(255,225,120,0.3)); border:1px solid rgba(255,170,110,0.55); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Jets</button>
      <button data-mode="4" style="flex:1 1 45%; padding:4px 6px; background:rgba(120,255,255,0.18); border:1px solid rgba(140,255,255,0.45); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Vortex</button>
      <button data-mode="5" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(200,255,245,0.2), rgba(140,220,255,0.2)); border:1px solid rgba(200,255,240,0.5); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Crystal Weave</button>
      <button data-mode="6" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(255,160,240,0.3), rgba(120,200,255,0.25)); border:1px solid rgba(220,150,255,0.55); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Chrono Streams</button>
      <button data-mode="8" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(180,210,255,0.18), rgba(220,255,255,0.18)); border:1px solid rgba(200,220,255,0.45); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Lunar Halo Drift</button>
      <button data-mode="10" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(150,210,255,0.18), rgba(200,255,255,0.18)); border:1px solid rgba(160,220,255,0.45); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Tidal Stream Bands</button>
      <button data-mode="11" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(180deg, rgba(200,160,255,0.16), rgba(120,180,255,0.16)); border:1px solid rgba(190,150,255,0.45); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Pillar Glow Columns</button>
      <button data-mode="12" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(140,200,255,0.18), rgba(100,160,220,0.22)); border:1px solid rgba(120,190,255,0.45); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Lagoon Mist Sheet</button>
      <button data-mode="15" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(200,240,255,0.22), rgba(160,200,255,0.22)); border:1px solid rgba(180,220,255,0.45); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Ice Coma Bloom</button>
    </div>
    <div data-status style="font-size:10px; opacity:.8;">Mode: Base</div>
  `;
  container.appendChild(el);

  const buttons = Array.from(el.querySelectorAll('button[data-mode]')) as HTMLButtonElement[];
  const status = el.querySelector('[data-status]') as HTMLDivElement | null;

  buttons.forEach((b)=>{
    const mode = Number(b.dataset.mode) as PathMode;
    const label = PATH_LABELS[mode];
    if(label) b.title = label;
  });

  function refresh(){
    const mode = getMode();
    // Fallback if an old/removed mode is somehow active
    if(!(mode in PATH_LABELS)){
      setMode(0);
    }
    buttons.forEach(b=>{
      b.style.outline='none'; b.style.boxShadow='none';
      if(Number(b.dataset.mode) === mode){
        b.style.boxShadow='0 0 0 1px rgba(255,255,255,0.8) inset';
      }
    });
    if(status){
      status.textContent = `Mode: ${PATH_LABELS[mode]}`;
    }
  }

  buttons.forEach(b=>{
    b.addEventListener('click',()=>{
      const m = Number(b.dataset.mode) as PathMode;
      if(m === getMode()) return;
      setMode(m);
      refresh();
    });
  });

  refresh();

  function destroy(){
    buttons.forEach(b=>b.replaceWith(b.cloneNode(true)));
    if(el.parentElement === container) container.removeChild(el);
  }

  return { element: el, destroy, setMode: (m:PathMode)=>{ setMode(m); refresh(); } };
}