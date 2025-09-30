// Dying Star geometry generator (same as galaxy, collapse handled in shader)
import { random } from 'canvas-sketch-util';

export function generateDyingStarGeometry(Im: number, e: number): Float32Array {
  const s = new Float32Array(Im * 3);
  for (let r = 0; r < Im; r++) {
    const o = r * 3;
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = 2 * Math.PI * Math.random();
    let baseRadius = Math.pow(Math.random(), 0.5) * e;
    let noise = 0;
    noise += 32 * (Math.random() - 0.5);
    noise += 16 * (Math.random() - 0.5);
    noise += 8 * (Math.random() - 0.5);
    noise += 4 * (Math.random() - 0.5);
    let radius = Math.max(0, baseRadius + noise);
    s[o] = radius * Math.sin(theta) * Math.cos(phi);
    s[o + 1] = radius * Math.sin(theta) * Math.sin(phi);
    s[o + 2] = radius * Math.cos(theta);
  }
  return s;
}
