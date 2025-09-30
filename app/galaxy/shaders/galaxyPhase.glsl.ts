// Galaxy phase snippet: computes pGalaxy, galaxyScale, galaxyColor
export const GALAXY_PHASE_SNIPPET = `
  vec3 pGalaxy = p; float galaxyScale = ptScale;
  float galaxyProgress = smoothstep(envStart, duration, time);
  float galaxyR = .5 * rand(position.xz * .01);
  galaxyProgress = smoothstep(galaxyR, 1., galaxyProgress);
  pGalaxy.x += 100.0 * sin(time*.01 + pGalaxy.x);
  pGalaxy.y += 100.0 * cos(time*.02 + pGalaxy.y);
  pGalaxy.z += 100.0 * sin(time*.026 + pGalaxy.z);
  galaxyProgress = qinticOut(galaxyProgress);
  galaxyScale *= smoothstep(0.0, 0.2, galaxyProgress);
  pGalaxy *= galaxyProgress;
  float galaxyRadius = sqrt(pGalaxy.x*pGalaxy.x+pGalaxy.y*pGalaxy.y);
  vec3 galaxyColor = mix(color1, color2, smoothstep(0., 100.0, galaxyRadius));
  galaxyColor = mix(galaxyColor, color3, smoothstep(100., 200.0, galaxyRadius));
`;