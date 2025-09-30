import * as THREE from 'three';

interface CreateMaterialOptions {
  vertexShader: string;
  fragmentShader: string;
  uniforms: { [key: string]: any };
}

export function createMaterial({ vertexShader, fragmentShader, uniforms }: CreateMaterialOptions) {
  return new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}