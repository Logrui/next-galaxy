import { random } from 'canvas-sketch-util';
import * as THREE from 'three';

// Exported magnetic axis & radii for shader use
export let neutronStar2Axis = new THREE.Vector3(0,0,1);
export let neutronStar2Radii = {
  core: 0,
  diskInner: 0,
  diskOuter: 0,
  fieldMax: 0,
  magneto: 0,
  halo: 0,
};

// Redesigned NeutronStar2 geometry: aims for more physically evocative structure
// Components:
//  - Ultra-dense core (degenerate matter) ~6%
//  - Polar caps (hotspots at magnetic poles) ~4%
//  - Collimated relativistic jets (narrow, extended) ~6%
//  - Thin equatorial debris / fallback disk (flattened ring) ~18%
//  - Dipole field line loops (arched magnetic lines) ~20%
//  - Inner magnetosphere shell (charged particle cloud) ~16%
//  - Sparse outer halo (contextual faint scatter) remainder (~30%)
// Notes:
//  - Magnetic axis is tilted vs rotation axis to create visually distinct poles.
//  - Jets originate at polar caps and stay tightly collimated with slight widening.
//  - Field lines sampled using dipole relation r = L * sin^2(theta) with several L shells.
//  - Disk uses power-law radial sampling and very small vertical dispersion.
//  - Halo uses power-law radius for sparse outer particles.
//  - We only set positions; shaders can later differentiate via inferred radial bands.
export function generateNeutronStar2Geometry(Im: number, e: number): Float32Array {
  const positions = new Float32Array(Im * 3);

  // Proportions (ensure sum <= 1; remainder -> halo)
  const coreFrac = 0.06;   // unchanged
  const capsFrac = 0.04;   // unchanged
  const jetsFrac = 0.07;   // slightly more jets
  const diskFrac = 0.23;   // more visual punch in disk
  const fieldFrac = 0.20;  // unchanged
  const magnetoFrac = 0.16; // unchanged
  const allocated = coreFrac + capsFrac + jetsFrac + diskFrac + fieldFrac + magnetoFrac;
  const haloFrac = Math.max(0, 1 - allocated); // ~0.30

  const coreCount = Math.floor(Im * coreFrac);
  const capsCount = Math.floor(Im * capsFrac);
  const jetsCount = Math.floor(Im * jetsFrac);
  const diskCount = Math.floor(Im * diskFrac);
  const fieldCount = Math.floor(Im * fieldFrac);
  const magnetoCount = Math.floor(Im * magnetoFrac);
  const used = coreCount + capsCount + jetsCount + diskCount + fieldCount + magnetoCount;
  const haloCount = Im - used;

  // Characteristic radii
  const R_core = e * 0.065;      // compact core
  const R_caps = R_core * 1.05;  // caps sit just above core surface
  const R_disk_inner = e * 0.10;
  const R_disk_outer = e * 0.55;
  const R_field_max = e * 0.60;
  const R_magneto = e * 0.70;
  const R_halo = e * 1.10;
  const jetLength = e * 1.2;
  const jetBaseRadius = e * 0.015;

  // Magnetic axis tilt (relative to +Z rotation axis) and rotation around Z
  const tilt = THREE.MathUtils.degToRad(18 + Math.random() * 10); // 18°–28°
  const tiltAzimuth = Math.random() * Math.PI * 2; // orientation of tilt

  // Precompute magnetic pole unit vectors
  const poleDir = new THREE.Vector3(
    Math.sin(tilt) * Math.cos(tiltAzimuth),
    Math.sin(tilt) * Math.sin(tiltAzimuth),
    Math.cos(tilt)
  );
  const southPoleDir = poleDir.clone().multiplyScalar(-1);

  // Persist exported axis & radii for external uniforms
  neutronStar2Axis = poleDir.clone();
  neutronStar2Radii = {
    core: R_core,
    diskInner: R_disk_inner,
    diskOuter: R_disk_outer,
    fieldMax: R_field_max,
    magneto: R_magneto,
    halo: R_halo,
  };

  let index = 0;
  const push = (x: number, y: number, z: number) => {
    const off = index * 3;
    positions[off] = x;
    positions[off + 1] = y;
    positions[off + 2] = z;
    index++;
  };

  // Utility: sample random on small Gaussian around direction vector at given radius
  function sampleAroundDirection(dir: THREE.Vector3, radius: number, spread: number): THREE.Vector3 {
    // Create orthonormal basis
    const up = Math.abs(dir.z) < 0.9 ? new THREE.Vector3(0,0,1) : new THREE.Vector3(1,0,0);
    const tangent1 = new THREE.Vector3().crossVectors(dir, up).normalize();
    const tangent2 = new THREE.Vector3().crossVectors(dir, tangent1).normalize();
    const g1 = random.gaussian(0, spread);
    const g2 = random.gaussian(0, spread);
    const pos = new THREE.Vector3().copy(dir).multiplyScalar(radius)
      .addScaledVector(tangent1, g1 * radius)
      .addScaledVector(tangent2, g2 * radius);
    return pos;
  }

  // 1. Dense core (slightly oblate)
  for (let i = 0; i < coreCount; i++) {
    const r = R_core * Math.pow(Math.random(), 0.25);
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = 2 * Math.PI * Math.random();
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * 0.82 * Math.cos(theta); // flatten along magnetic axis approx
    push(x, y, z);
  }

  // 2. Polar caps (cluster near poles on a small annulus)
  for (let i = 0; i < capsCount; i++) {
    const which = i < capsCount / 2 ? poleDir : southPoleDir; // half each pole
    const radial = R_caps * (0.95 + 0.10 * Math.random());
    const spread = 0.20; // angular spread factor
    const p = sampleAroundDirection(which, radial, spread * 0.02);
    push(p.x, p.y, p.z);
  }

  // 3. Jets (collimated along magnetic axis, extended)
  for (let i = 0; i < jetsCount; i++) {
    const alongNorth = i < jetsCount / 2;
    const baseDir = alongNorth ? poleDir : southPoleDir;
    const t = Math.pow(Math.random(), 0.35); // bias toward base for brightness
    const length = R_caps + t * (jetLength - R_caps);
    // radius grows slowly with distance (very collimated)
    const radius = jetBaseRadius + (t * t) * jetBaseRadius * 2;
    const p = sampleAroundDirection(baseDir, length, radius / length * 2.5);
    push(p.x, p.y, p.z);
  }

  // 4. Thin equatorial disk (use rotation axis Z, not magnetic axis)
  for (let i = 0; i < diskCount; i++) {
    // Power law radial distribution (denser inside)
    const u = Math.random();
    const r = R_disk_inner + (R_disk_outer - R_disk_inner) * Math.pow(u, 0.55);
    const phi = 2 * Math.PI * Math.random();
    const x = r * Math.cos(phi);
    const y = r * Math.sin(phi);
    const z = random.gaussian(0, e * 0.01); // very thin
    // Add mild spiral asymmetry
    const spiral = 0.03 * r * Math.sin(phi * 3 + u * 10);
    push(x + spiral * Math.cos(phi), y + spiral * Math.sin(phi), z);
  }

  // 5. Dipole field line loops
  // Precompute rotation quaternion to align magnetic frame to poleDir
  const dipoleQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), poleDir);
  for (let i = 0; i < fieldCount; i++) {
    const L = R_core * 1.2 + Math.random() * (R_field_max - R_core * 1.2);
    const theta = Math.acos(1 - 2 * Math.random());
    const sinT = Math.sin(theta);
    const r = L * sinT * sinT;
    const phi = 2 * Math.PI * Math.random();
    let x = r * Math.sin(theta) * Math.cos(phi);
    let y = r * Math.sin(theta) * Math.sin(phi);
    let z = r * Math.cos(theta);
    const v = new THREE.Vector3(x,y,z).applyQuaternion(dipoleQuat);
    v.x += random.gaussian(0, r * 0.015);
    v.y += random.gaussian(0, r * 0.015);
    v.z += random.gaussian(0, r * 0.015);
    push(v.x, v.y, v.z);
  }

  // 6. Inner magnetosphere shell (rough spherical shell with polar depletion)
  for (let i = 0; i < magnetoCount; i++) {
    const rr = R_field_max + Math.random() * (R_magneto - R_field_max);
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = 2 * Math.PI * Math.random();
    const depletion = Math.pow(Math.sin(theta), 0.7); // fewer near poles (theta≈0,π)
    const effectiveR = rr * depletion;
    const x = effectiveR * Math.sin(theta) * Math.cos(phi);
    const y = effectiveR * Math.sin(theta) * Math.sin(phi);
    const z = effectiveR * Math.cos(theta);
    push(x, y, z);
  }

  // 7. Outer halo (very sparse, power-law radius)
  for (let i = 0; i < haloCount; i++) {
    const u = Math.random();
    const r = R_magneto + (R_halo - R_magneto) * Math.pow(u, 0.25); // concentrate inner halo
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = 2 * Math.PI * Math.random();
    const x = r * Math.sin(theta) * Math.cos(phi) + random.gaussian(0, r * 0.02);
    const y = r * Math.sin(theta) * Math.sin(phi) + random.gaussian(0, r * 0.02);
    const z = r * Math.cos(theta) + random.gaussian(0, r * 0.02);
    push(x, y, z);
  }

  return positions;
}
