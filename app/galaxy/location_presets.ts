import * as THREE from 'three';

export interface CameraPreset {
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  target: {
    x: number;
    y: number;
    z: number;
  };
  description: string;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    name: "Overview",
    position: { x: 59.3, y: 196, z: 355 },
    target: { x: 0, y: 0, z: 0 },
    description: "Default elevated overview of the galaxy"
  },
  {
    name: "Start",
    position: { x: 318, y: 1050, z: 1900 },
    target: { x: 0, y: 0, z: 0 },
    description: "Elevated forward start view toward galaxy center"
  },
  {
    name: "Top Down",
    position: { x: 407.2, y: 298.2, z: 205 },
    target: { x: 0, y: 0, z: 0 },
    description: "Bird's eye view from directly above"
  },
  {
    name: "Side View",
    position: { x: 400, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    description: "Profile view from the side"
  },
  {
    name: "Side View 2",
    position: { x: -400, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    description: "Profile view from the opposite side"
  },
  {
    name: "Close Up",
    position: { x: 0, y: 50, z: 150 },
    target: { x: 0, y: 0, z: 0 },
    description: "Close view inside the galaxy"
  },
  {
    name: "Distant",
    position: { x: 0, y: 300, z: 600 },
    target: { x: 0, y: 0, z: 0 },
    description: "Far back view of the entire galaxy"
  },
  {
    name: "Angled",
    position: { x: 200, y: 200, z: 200 },
    target: { x: 0, y: 0, z: 0 },
    description: "Diagonal view from corner perspective"
  }
];

export function applyCameraPreset(camera: THREE.Camera, controls: any, preset: CameraPreset): void {
  camera.position.set(preset.position.x, preset.position.y, preset.position.z);
  controls.target.set(preset.target.x, preset.target.y, preset.target.z);
  controls.update();
}
