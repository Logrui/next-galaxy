import React from 'react';

export interface CameraPreset {
  name: string;
  description: string;
}

export interface CameraPresetPanelProps {
  presets: CameraPreset[];
  onPresetClick: (index: number) => void;
}

export const CameraPresetPanel: React.FC<CameraPresetPanelProps> = ({ presets, onPresetClick }) => (
  <div style={{
    position: 'absolute',
    top: 20,
    left: 200,
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '10px 15px',
    borderRadius: 5,
    fontFamily: 'monospace',
    fontSize: 12,
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.2)'
  }}>
    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Camera Presets</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
      {presets.map((preset, index) => (
        <button
          key={preset.name}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 3,
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: 'monospace'
          }}
          title={preset.description}
          onClick={() => onPresetClick(index)}
        >
          {preset.name}
        </button>
      ))}
    </div>
  </div>
);
