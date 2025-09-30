import React from 'react';

export type Phase = 'nebula' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2';

export interface PhasePanelProps {
  active: Phase;
  onPhaseChange: (phase: Phase) => void;
  phaseMix: number;
  dyingMix: number;
}

export const PhasePanel: React.FC<PhasePanelProps> = ({ active, onPhaseChange, phaseMix, dyingMix }) => (
  <div style={{
    position: 'absolute',
    top: 20,
    left: 400,
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 6,
    fontFamily: 'monospace',
    fontSize: 12,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    border: '1px solid rgba(255,255,255,0.2)',
    minWidth: 140,
    transition: 'left .25s ease'
  }}>
    <div style={{ fontWeight: 'bold' }}>Phase</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button
        id="btn-nebula"
        style={buttonStyle(active === 'nebula', 'default')}
        onClick={() => onPhaseChange('nebula')}
      >Nebula</button>
      <button
        id="btn-galaxy"
        style={buttonStyle(active === 'galaxy', 'galaxy')}
        onClick={() => onPhaseChange('galaxy')}
      >Galaxy</button>
      <button
        id="btn-dying"
        style={buttonStyle(active === 'dying', 'dying')}
        onClick={() => onPhaseChange('dying')}
      >Dying Star</button>
      <button
        id="btn-neutron"
        style={buttonStyle(active === 'neutron', 'neutron')}
        onClick={() => onPhaseChange('neutron')}
      >Neutron Star</button>
      <button
        id="btn-neutronStar2"
        style={buttonStyle(active === 'neutronStar2', 'neutronStar2')}
        onClick={() => onPhaseChange('neutronStar2')}
      >NeutronStar2</button>
    </div>
    <div id="phase-status" style={{ opacity: 0.8, fontSize: 10, letterSpacing: 0.5 }}>
      Active: {active === 'nebula' ? 'Nebula' : active === 'galaxy' ? 'Galaxy' : active === 'dying' ? 'Dying Star' : active === 'neutron' ? 'Neutron Star' : 'NeutronStar2'} (phaseMix={phaseMix.toFixed(2)}, dyingMix={dyingMix.toFixed(2)})
    </div>
  </div>
);

function buttonStyle(active: boolean, type: 'default' | 'galaxy' | 'dying' | 'neutron' | 'neutronStar2'): React.CSSProperties {
  let base: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.35)',
    color: '#fff',
    padding: '4px 6px',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 11
  };
  if (active) {
    base = { ...base, boxShadow: '0 0 0 1px rgba(255,255,255,0.7) inset', background: 'rgba(120,160,255,0.45)' };
  }
  if (type === 'galaxy') {
    base.background = 'rgba(120,160,255,0.35)';
    if (active) base.boxShadow = '0 0 0 1px rgba(140,170,255,0.6) inset';
  }
  if (type === 'dying') {
    base.background = 'linear-gradient(135deg, rgba(255,140,120,0.35), rgba(180,60,255,0.35))';
    base.border = '1px solid rgba(255,255,255,0.45)';
  }
  if (type === 'neutron') {
    base.background = 'linear-gradient(135deg, #b0e0ff 0%, #fff 100%)';
    base.border = '1px solid #b0e0ff';
    base.color = '#222';
  }
  if (type === 'neutronStar2') {
    base.background = 'linear-gradient(135deg, rgba(255,100,255,0.4), rgba(100,255,255,0.6))';
    base.border = '1px solid rgba(255,100,255,0.7)';
    base.color = '#000';
    base.fontWeight = 'bold';
  }
  return base;
}
