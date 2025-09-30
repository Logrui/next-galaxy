import React from 'react';

export interface CameraInfoPanelProps {
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
}

export const CameraInfoPanel: React.FC<CameraInfoPanelProps> = ({ cameraPosition, cameraTarget }) => (
  <div style={{
    position: 'absolute',
    top: 20,
    left: 20,
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '10px 15px',
    borderRadius: 5,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 1.4,
    pointerEvents: 'none',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.2)'
  }}>
    <div style={{ fontWeight: 'bold', marginBottom: 5 }}>Camera Position</div>
    <div>X: <span>{cameraPosition.x.toFixed(1)}</span></div>
    <div>Y: <span>{cameraPosition.y.toFixed(1)}</span></div>
    <div>Z: <span>{cameraPosition.z.toFixed(1)}</span></div>
    <div style={{ fontWeight: 'bold', margin: '8px 0 5px 0' }}>Camera Target</div>
    <div>X: <span>{cameraTarget.x.toFixed(1)}</span></div>
    <div>Y: <span>{cameraTarget.y.toFixed(1)}</span></div>
    <div>Z: <span>{cameraTarget.z.toFixed(1)}</span></div>
  </div>
);
