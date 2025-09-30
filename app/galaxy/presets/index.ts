// Central export + phase-aware geometry selection helper.
// Currently all generators share the same distribution; future changes can
// differentiate them without modifying GalaxyCanvas.

import { generateNebulaGeometry } from './nebula';
import { generateGalaxyGeometry } from './galaxy';
import { generateDyingStarGeometry } from './dyingStar';

export type PhaseName = 'nebula' | 'galaxy' | 'dyingStar';

interface GeometryCacheEntry {
  data: Float32Array;
  count: number;
  extent: number;
}

// Simple memoization so we don't regenerate identical buffers repeatedly.
const geometryCache = new Map<string, GeometryCacheEntry>();

export function getGeometryForPhase(phase: PhaseName, count: number, extent: number): Float32Array {
  const key = `${phase}-${count}-${extent}`;
  const cached = geometryCache.get(key);
  if (cached) return cached.data;

  let data: Float32Array;
  switch (phase) {
    case 'nebula':
      data = generateNebulaGeometry(count, extent);
      break;
    case 'galaxy':
      data = generateGalaxyGeometry(count, extent);
      break;
    case 'dyingStar':
      data = generateDyingStarGeometry(count, extent);
      break;
    default:
      data = generateNebulaGeometry(count, extent);
  }
  geometryCache.set(key, { data, count, extent });
  return data;
}

export { generateNebulaGeometry, generateGalaxyGeometry, generateDyingStarGeometry };