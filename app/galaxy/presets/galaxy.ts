// Improved galaxy geometry generator: radial disk + spiral arms + core bulge + vertical falloff
// Produces a flattened distribution with adjustable arm count and noise.

interface GalaxyOptions {
  arms?: number;          // number of major arms
  armSpread?: number;     // angular spread of each arm
  armTwist?: number;      // total twist factor
  coreRadius?: number;    // radius inside which a 3D bulge forms
  thickness?: number;     // base vertical thickness
  falloff?: number;       // vertical falloff factor
  radialJitter?: number;  // radial noise scale
  armNoise?: number;      // deviation off arm axis
}

export function generateGalaxyGeometry(count: number, extent: number, opts: GalaxyOptions = {}): Float32Array {
  const {
    arms = 4,
    armSpread = 0.55,
    armTwist = 1.8, // how much arms wind outward
    coreRadius = extent * 0.12,
    thickness = extent * 0.015,
    falloff = 2.2,
    radialJitter = 0.25,
    armNoise = 0.9,
  } = opts;

  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    // radius biased toward center but allowing outskirts
    const u = Math.random();
    const radius = Math.pow(u, 0.65) * extent; // distribution taper

    // Which arm (fractional) and base angle
    const armIndex = Math.random() * arms;
    const baseAngle = (armIndex / arms) * Math.PI * 2.0;

    // Spiral twist: angle increases with radius
    const twist = armTwist * (radius / extent);
    let angle = baseAngle + twist * Math.PI * 2.0;

    // Add arm-local spread & noise
    const spread = (Math.random() - 0.5) * armSpread; // lateral dispersion
    angle += spread;
    // Per-point off-arm jitter scaling with armNoise
    angle += (Math.random() - 0.5) * armNoise * (radius / extent);

    // Radial jitter to break perfect logarithmic spiral
    const rJ = radius * (1.0 + (Math.random() - 0.5) * radialJitter);

    // Position in plane
    let x = rJ * Math.cos(angle);
    let y = rJ * Math.sin(angle);

    // Core bulge: inside coreRadius add a 3D spheroidal puff
    let z: number;
    if (radius < coreRadius) {
      const coreNorm = (coreRadius - radius) / coreRadius; // 1 at center -> 0 at edge
      // denser center using power curve
      const bulgeR = thickness * 10.0 * Math.pow(coreNorm, 0.35);
      z = (Math.random() - 0.5) * bulgeR;
      // Slightly compress xy near very center to increase density
      const cScale = 1.0 - 0.15 * coreNorm;
      x *= cScale; y *= cScale;
    } else {
      // Disk thickness falls off with radius
      const dNorm = radius / extent; // 0..1
      const t = thickness * Math.pow(1.0 - dNorm, falloff); // thinner outer disk
      z = (Math.random() - 0.5) * t * 2.0;
    }

    data[o] = x;
    data[o + 1] = y;
    data[o + 2] = z;
  }
  return data;
}
