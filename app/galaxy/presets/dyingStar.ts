// Dying star collapse geometry generator (placeholder)
// For now this uses the same noisy sphere distribution as nebula/galaxy so that
// switching phases (including a future dyingStar phase) does not change the
// initial visual output until shader morphing applies collapse effects.
// Later this can be replaced by a tighter clustered distribution (e.g. gradually
// pulling particles toward center) while keeping count & attribute layout.

export function generateDyingStarGeometry(count: number, extent: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = 2 * Math.PI * Math.random();
    let baseRadius = Math.pow(Math.random(), 0.5) * extent;
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
