import * as THREE from 'three';

// Factory for the shader uniforms. Mirrors the inline object previously in GalaxyCanvas.
export function createUniforms() {
  const uniforms: { [key: string]: any } = {
    time: { value: 9 },
    resolution: { value: new THREE.Vector4() },
    duration: { value: 10 },
    envStart: { value: 1.25 },
    interpolate: { value: false },
    fade: { value: 0 },
    fdAlpha: { value: 0 },
    globalAlpha: { value: 1 },
    posTex: { value: null },
    color: { value: null },
    scaleTex: { value: null },
    scale: { value: 1 },
    size: { value: 2.6 },
    nebula: { value: false },
    focalDistance: { value: 385 },
    aperture: { value: 300 },
    maxParticleSize: { value: 8 },
    tint: { value: new THREE.Color('#fff') },
    glow: { value: false },
    superOpacity: { value: 1 },
    superScale: { value: 1 },
    hover: { value: 0 },
    planets: { value: [
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(10000,10000,10000),
      new THREE.Vector3(10000,10000,10000),
      new THREE.Vector3(10000,10000,10000),
      new THREE.Vector3(10000,10000,10000),
      new THREE.Vector3(10000,10000,10000),
      new THREE.Vector3(10000,10000,10000),
      new THREE.Vector3(10000,10000,10000),
    ] },
    hoverPoint: { value: new THREE.Vector3(0,0,0) },
    interaction: { value: new THREE.Vector4(0,0,0,0) },
    iRadius: { value: 11 },
    nebulaAmp: { value: 1.5 },
    phaseMix: { value: 1.0 },
    dyingMix: { value: 0.0 },
    extraPathMode: { value: 0 }, // current active (legacy immediate mode reference)
    fromPathMode: { value: 0 },  // start mode for blend
    toPathMode: { value: 0 },    // target mode for blend
    pathMix: { value: 1.0 },     // 0 => fromPath, 1 => toPath
  };
  return uniforms;
}