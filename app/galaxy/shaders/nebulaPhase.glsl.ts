// Nebula phase snippet: computes pNebula, nebulaScale, nebulaColor
export const NEBULA_PHASE_SNIPPET = `
  vec3 pNebula = p; float nebulaScale = ptScale; vec3 nebulaColor = color1;
  if(phaseMix < 0.999) {
    float pr = smoothstep(0., duration, time);
    float progress = qinticOut(pr);
    float tile = progress*63.0;
    float tile0 = floor(tile); float tile1 = ceil(tile);
    vec2 uv0 = getUVTile(tile0); vec2 uv1 = getUVTile(tile1);
    vec3 p1 = getPosition(uv0)*1000.; vec3 p2 = getPosition(uv1)*1000.;
    float tNeb = fract(tile);
    pNebula = interpolate ? mix(p1, p2, tNeb) : p1;
    vec4 c1 = texture2D(color, uv0); vec4 c2 = texture2D(color, uv1);
    vec4 _color = interpolate ? mix(c1, c2, tNeb) : c1; nebulaColor = _color.rgb;
    nebulaScale = texture2D(scaleTex, uv).r; nebulaScale *= smoothstep(0. , .1, length(pNebula));
    vec3 pNoise; float amp = mix(nebulaAmp, nebulaAmp*.4, fade); float t2 = time * .08;
    pNoise.x = amp * snoise(vec3(position.xy*.01, t2));
    pNoise.z = amp * snoise(vec3(position.zy*.01, t2 *1.1));
    pNoise.y = pNoise.x;
    pNebula.z = mix(pNebula.z, pNebula.z + 45.0 * snoise(vec3(pNebula.xy * .0075, time *.01)), fdAlpha);
    float ptNeb = smoothstep(.5, 1., progress);
    pNebula = mix(pNebula, pNebula+pNoise, ptNeb);
  }
`;