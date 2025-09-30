// Additional path variants: Spiral, Ring, Jets
// Controlled by uniform extraPathMode (0=Base passthrough,1=Spiral,2=Ring,3=Jets)
// Assumes existing variables: p (vec3), baseP, galaxyColor, vColor, ptScale, time
export const CUSTOM_PATHS_SNIPPET = `
  if(extraPathMode == 0){
    // Base: ensure we use the blended phase baseline
    p = baseP;
    ptScale = baseScale;
    vColor = baseColor;
  } else if(extraPathMode > 0){
    vec3 cp = baseP;
    if(extraPathMode == 1){
      // Spiral: continuous one-direction rotation (remove oscillation)
      float r = length(cp.xy)+0.0001;
      float angle = atan(cp.y, cp.x);
      // Continuous angular velocity (scaled down for smooth motion)
  // Extremely slow continuous rotation (further reduced)
  float angularVel = 0.008; // ~5.6x slower than previous 0.045
      float twistStrength = 4.5; // radial twist multiplier
      angle += twistStrength * (r*0.0025) + angularVel * time;
      cp.x = r * cos(angle);
      cp.y = r * sin(angle);
      // Mild vertical taper with radius to accent disk form
      cp.z *= mix(0.8, 0.3, smoothstep(60.0, 280.0, r));
      vColor = mix(vColor, galaxyColor, 0.55);
      ptScale *= 1.12;
    } else if(extraPathMode == 2){
      // Ring: harder convergence toward target radius and strong flattening
      float targetR = 170.0 + 20.0*sin(time*0.25);
      float r = length(cp.xy)+0.0001;
      float delta = targetR - r;
      cp.xy += (delta * 0.35) * normalize(cp.xy);
      cp.z *= 0.08;
      vColor = mix(vColor, vec3(0.85,0.7,1.0), smoothstep(0.0, targetR, r));
      ptScale *= 1.25;
    } else if(extraPathMode == 3){
      // Jets: more aggressive axial stretch and taper
      float radial = length(cp.xy);
      float jetMask = smoothstep(140.0, 25.0, radial);
      float axialWave = sin(time*0.35 + cp.z*0.025);
      cp.xy *= mix(0.85, 0.25, jetMask);
      cp.z += jetMask * axialWave * 320.0;
      vColor = mix(vColor, vec3(1.0,0.55,0.35), jetMask*0.75);
      ptScale = mix(ptScale, ptScale*2.0, jetMask);
    }
    // Immediate blend for clear user feedback when switching modes
    p = cp;
  }
`;