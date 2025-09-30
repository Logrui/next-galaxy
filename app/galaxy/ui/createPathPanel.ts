export type PathMode = 0 | 1 | 2 | 3; // 0=Base,1=Spiral,2=Ring,3=Jets

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
    <div style="display:flex; flex-wrap:wrap; gap:6px;">
      <button data-mode="0" style="flex:1 1 45%; padding:4px 6px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.35); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Base</button>
      <button data-mode="1" style="flex:1 1 45%; padding:4px 6px; background:rgba(40,140,255,0.25); border:1px solid rgba(120,180,255,0.55); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Spiral</button>
      <button data-mode="2" style="flex:1 1 45%; padding:4px 6px; background:rgba(200,140,255,0.25); border:1px solid rgba(230,200,255,0.55); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Ring</button>
      <button data-mode="3" style="flex:1 1 45%; padding:4px 6px; background:linear-gradient(135deg, rgba(255,120,70,0.35), rgba(255,225,120,0.3)); border:1px solid rgba(255,170,110,0.55); color:#fff; border-radius:3px; cursor:pointer; font-size:11px;">Jets</button>
    </div>
    <div data-status style="font-size:10px; opacity:.8;">Mode: Base</div>
  `;
  container.appendChild(el);

  const buttons = Array.from(el.querySelectorAll('button[data-mode]')) as HTMLButtonElement[];
  const status = el.querySelector('[data-status]') as HTMLDivElement | null;

  function refresh(){
    const mode = getMode();
    buttons.forEach(b=>{
      b.style.outline='none'; b.style.boxShadow='none';
      if(Number(b.dataset.mode) === mode){
        b.style.boxShadow='0 0 0 1px rgba(255,255,255,0.8) inset';
      }
    });
    if(status){
      const names: Record<PathMode,string> = {0:'Base',1:'Spiral',2:'Ring',3:'Jets'};
      status.textContent = `Mode: ${names[mode]}`;
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

  return { element: el, destroy };
}