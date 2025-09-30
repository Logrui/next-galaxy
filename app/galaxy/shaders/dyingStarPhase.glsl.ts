// Dying star phase snippet: applies collapse if dyingMix>0
export const DYING_STAR_PHASE_SNIPPET = `
  // At this point, p / ptScale / vColor may have been modified by extra path modes.
  // Preserve those when dyingMix is ~0 instead of forcibly resetting to base values.
  if(dyingMix > 0.001) {
    float collapse = dyingMix;
    vec3 dsBase = p; // use current (possibly path-modified) position as starting point
    float swirlT = time * 0.2;
    vec3 dsP = dsBase;
    dsP.xy += 40.0 * (1.0-collapse) * vec2(
      snoise(vec3(dsBase.xy*0.02, swirlT)),
      snoise(vec3(dsBase.yx*0.02, swirlT*1.1))
    );
    dsP *= mix(0.5, 0.2, collapse);
    float dsScale = ptScale * mix(1.5, 0.4, collapse);
    vec3 dsColor = vColor; // start from current color
    p = mix(dsBase, dsP, dyingMix);
    ptScale = mix(ptScale, dsScale, dyingMix);
    vColor = mix(vColor, dsColor, dyingMix); // dsColor currently same; placeholder for future tint
  }
`;