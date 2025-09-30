// Nebula (legacy noisy sphere) geometry generator
// Matches the original inline distribution logic in GalaxyCanvas prior to modularization.

export function generateNebulaGeometry(count: number, extent: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = 2 * Math.PI * Math.random();
    let baseRadius = Math.pow(Math.random(), 0.5) * extent; // bias toward center
    let noise = 0;
    noise += 32 * (Math.random() - 0.5);
    noise += 16 * (Math.random() - 0.5);
    noise += 8 * (Math.random() - 0.5);
    noise += 4 * (Math.random() - 0.5);
    const radius = Math.max(0, baseRadius + noise);
    arr[o] = radius * Math.sin(theta) * Math.cos(phi);
    arr[o + 1] = radius * Math.sin(theta) * Math.sin(phi);
    arr[o + 2] = radius * Math.cos(theta);
  }
  return arr;
}
