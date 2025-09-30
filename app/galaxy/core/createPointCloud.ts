import * as THREE from 'three';
import { getGeometryForPhase, PhaseName } from '../presets';

interface CreatePointCloudOptions {
  phase: PhaseName;
  count: number;
  extent: number;
  material: THREE.Material;
}

export function createPointCloud({ phase, count, extent, material }: CreatePointCloudOptions) {
  const positions = getGeometryForPhase(phase, count, extent);
  const uv = new Float32Array(count * 2);
  let n = 0;
  for (let r = 0; r < 128; r++) {
    for (let o = 0; o < 256; o++) {
      uv[n * 2] = 1 / 256 + o / 257;
      uv[n * 2 + 1] = 1 / 128 + r / 129;
      n++;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  const points = new THREE.Points(geo, material);
  points.rotation.x = Math.PI / 2;
  return { points, geometry: geo };
}