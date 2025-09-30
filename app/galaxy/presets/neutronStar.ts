// Neutron Star geometry generator: compact core with polar jets
import { random } from 'canvas-sketch-util';

export function generateNeutronStarGeometry(Im: number, e: number): Float32Array {
  const s = new Float32Array(Im * 3);
  for (let r = 0; r < Im; r++) {
    const o = r * 3;
    // 10% of particles: polar jets
    if (Math.random() < 0.10) {
      const sign = Math.random() < 0.5 ? 1 : -1;
      const jetTheta = Math.acos(1 - 0.08 * Math.random());
      const jetPhi = 2 * Math.PI * Math.random();
      let baseRadius = e * (0.18 + 0.82 * Math.random());
      s[o] = baseRadius * Math.sin(jetTheta) * Math.cos(jetPhi);
      s[o + 1] = baseRadius * Math.sin(jetTheta) * Math.sin(jetPhi);
      s[o + 2] = sign * baseRadius * Math.cos(jetTheta);
    } else {
      // Compact core
      const theta = Math.acos(1 - 2 * Math.random());
      const phi = 2 * Math.PI * Math.random();
      let baseRadius = Math.pow(Math.random(), 0.35) * (e * 0.18);
      let noise = 0;
      noise += 12 * (Math.random() - 0.5);
      noise += 6 * (Math.random() - 0.5);
      let radius = Math.max(0, baseRadius + noise);
      s[o] = radius * Math.sin(theta) * Math.cos(phi);
      s[o + 1] = radius * Math.sin(theta) * Math.sin(phi);
      s[o + 2] = radius * Math.cos(theta);
    }
  }
  return s;
}

// NeutronStar2 geometry generator: enhanced neutron star with magnetic field lines and pulsar beams
export function generateNeutronStar2Geometry(Im: number, e: number): Float32Array {
  const positions = new Float32Array(Im * 3);

  const coreCount = Math.floor(Im * 0.25);
  const magneticFieldCount = Math.floor(Im * 0.40);
  const pulsarBeamCount = Math.floor(Im * 0.20);
  const crustCount = Math.floor(Im * 0.10);
  const accretionCount = Im - coreCount - magneticFieldCount - pulsarBeamCount - crustCount;

  const coreRadius = e * 0.08;
  const crustRadius = e * 0.12;
  const magneticFieldRadius = e * 0.35;
  const pulsarBeamLength = e * 0.85;
  const pulsarBeamRadius = e * 0.03;
  const accretionRadius = e * 0.25;

  let index = 0;

  const push = (x: number, y: number, z: number) => {
    const offset = index * 3;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    index++;
  };

  // Ultra-dense core
  for (let i = 0; i < coreCount; i++) {
    const radial = coreRadius * Math.pow(Math.random(), 0.2);
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = Math.random() * Math.PI * 2;
    const pulsation = 0.05 * Math.sin(phi * 8 + theta * 4);
    const x = (radial + pulsation) * Math.sin(theta) * Math.cos(phi);
    const y = radial * 0.8 * Math.cos(theta); // Slightly flattened
    const z = (radial + pulsation) * Math.sin(theta) * Math.sin(phi);
    push(x, y, z);
  }

  // Neutron star crust
  for (let i = 0; i < crustCount; i++) {
    const radial = coreRadius + (crustRadius - coreRadius) * Math.random();
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = Math.random() * Math.PI * 2;
    const crystalStructure = random.gaussian(0, coreRadius * 0.02);
    const x = (radial + crystalStructure) * Math.sin(theta) * Math.cos(phi);
    const y = radial * 0.85 * Math.cos(theta);
    const z = (radial + crystalStructure) * Math.sin(theta) * Math.sin(phi);
    push(x, y, z);
  }

  // Magnetic field lines (dipole field pattern)
  for (let i = 0; i < magneticFieldCount; i++) {
    const fieldLineParam = Math.random();
    const latitudeAngle = (Math.random() - 0.5) * Math.PI * 0.8; // -72° to +72°
    const longitudeAngle = Math.random() * Math.PI * 2;
    
    // Dipole field line equation: r = r0 * sin²(θ)
    const fieldRadius = magneticFieldRadius * Math.pow(Math.sin(Math.abs(latitudeAngle) + 0.1), 2);
    const height = fieldRadius * Math.cos(latitudeAngle) * (0.5 + 0.5 * fieldLineParam);
    
    const fieldNoise = random.gaussian(0, magneticFieldRadius * 0.03);
    const spiralTwist = 0.1 * Math.sin(longitudeAngle * 3 + fieldLineParam * 2);
    
    const x = (fieldRadius + fieldNoise + spiralTwist) * Math.cos(longitudeAngle);
    const y = height + random.gaussian(0, magneticFieldRadius * 0.02);
    const z = (fieldRadius + fieldNoise - spiralTwist) * Math.sin(longitudeAngle);
    push(x, y, z);
  }

  // Pulsar beams (rotating lighthouse effect)
  for (let i = 0; i < pulsarBeamCount; i++) {
    const beamAngle = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.15); // ±27° from poles
    const rotationPhase = Math.random() * Math.PI * 2;
    const beamHeight = crustRadius + Math.pow(Math.random(), 0.4) * pulsarBeamLength;
    const beamWidth = Math.pow(Math.random(), 0.6) * pulsarBeamRadius;
    
    // Rotate beam around neutron star axis
    const x = beamWidth * Math.cos(rotationPhase);
    const y = beamHeight * Math.sin(beamAngle) + random.gaussian(0, pulsarBeamRadius * 0.1);
    const z = beamWidth * Math.sin(rotationPhase);
    
    // Add beam divergence
    const divergence = random.gaussian(0, pulsarBeamRadius * 0.3);
    push(x + divergence, y, z + divergence);
  }

  // Hot spot accretion streams
  for (let i = 0; i < accretionCount; i++) {
    const streamAngle = Math.random() * Math.PI * 2;
    const streamHeight = random.gaussian(0, accretionRadius * 0.3);
    const streamRadius = accretionRadius * (0.7 + 0.3 * Math.random());
    const turbulence = random.gaussian(0, accretionRadius * 0.08);
    
    // Spiral infall pattern
    const spiralFactor = 0.2 * Math.sin(streamAngle * 4 + streamHeight * 0.1);
    const x = (streamRadius + spiralFactor + turbulence) * Math.cos(streamAngle);
    const y = streamHeight + 0.1 * accretionRadius * Math.sin(streamAngle * 6);
    const z = (streamRadius - spiralFactor + turbulence) * Math.sin(streamAngle);
    push(x, y, z);
  }

  return positions;
}
