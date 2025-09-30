// Additional path variants: Spiral, Ring, Jets, Vortex, Shells, Neutron Star, Helix
// Controlled by uniform extraPathMode
// 0=Base,1=Spiral,2=Ring,3=Jets,4=Vortex,5=Shells,6=NeutronStar,7=Helix
// Assumes existing variables: p (vec3), baseP, galaxyColor, vColor, ptScale, time
export const CUSTOM_PATHS_SNIPPET = `
  // Helper applying a path mode; returns transformed position, scale and color delta
  vec3 pathPosA = baseP; float pathScaleA = baseScale; vec3 pathColorA = baseColor;
  vec3 pathPosB = baseP; float pathScaleB = baseScale; vec3 pathColorB = baseColor;

  // Function-like macro via scoped blocks for each mode
  // Base mode (0)
  if(fromPathMode == 0){ pathPosA = baseP; pathScaleA = baseScale; pathColorA = baseColor; }
  if(toPathMode == 0){ pathPosB = baseP; pathScaleB = baseScale; pathColorB = baseColor; }

  // Spiral (1)
  if(fromPathMode == 1){
    vec3 cp = baseP; float r = length(cp.xy)+0.0001; float angle = atan(cp.y, cp.x); float angularVel = 0.008; float twistStrength = 4.5; angle += twistStrength*(r*0.0025)+angularVel*time; cp.x=r*cos(angle); cp.y=r*sin(angle); cp.z *= mix(0.8,0.3,smoothstep(60.0,280.0,r)); pathPosA=cp; pathScaleA=baseScale*1.12; pathColorA = mix(baseColor, galaxyColor, 0.55);
  }
  if(toPathMode == 1){
    vec3 cp = baseP; float r = length(cp.xy)+0.0001; float angle = atan(cp.y, cp.x); float angularVel = 0.008; float twistStrength = 4.5; angle += twistStrength*(r*0.0025)+angularVel*time; cp.x=r*cos(angle); cp.y=r*sin(angle); cp.z *= mix(0.8,0.3,smoothstep(60.0,280.0,r)); pathPosB=cp; pathScaleB=baseScale*1.12; pathColorB = mix(baseColor, galaxyColor, 0.55);
  }

  // Ring (2)
  if(fromPathMode == 2){ vec3 cp=baseP; float targetR=170.0+20.0*sin(time*0.25); float r=length(cp.xy)+0.0001; float delta=targetR-r; cp.xy += (delta*0.35)*normalize(cp.xy); cp.z*=0.08; pathPosA=cp; pathScaleA=baseScale*1.25; pathColorA = mix(baseColor, vec3(0.85,0.7,1.0), smoothstep(0.0,targetR,r)); }
  if(toPathMode == 2){ vec3 cp=baseP; float targetR=170.0+20.0*sin(time*0.25); float r=length(cp.xy)+0.0001; float delta=targetR-r; cp.xy += (delta*0.35)*normalize(cp.xy); cp.z*=0.08; pathPosB=cp; pathScaleB=baseScale*1.25; pathColorB = mix(baseColor, vec3(0.85,0.7,1.0), smoothstep(0.0,targetR,r)); }

  // Jets (3)
  if(fromPathMode == 3){ vec3 cp=baseP; float radial=length(cp.xy); float jetMask=smoothstep(140.0,25.0,radial); float axialWave=sin(time*0.35 + cp.z*0.025); cp.xy *= mix(0.85,0.25,jetMask); cp.z += jetMask*axialWave*320.0; pathPosA=cp; pathScaleA = mix(baseScale, baseScale*2.0, jetMask); pathColorA = mix(baseColor, vec3(1.0,0.55,0.35), jetMask*0.75); }
  if(toPathMode == 3){ vec3 cp=baseP; float radial=length(cp.xy); float jetMask=smoothstep(140.0,25.0,radial); float axialWave=sin(time*0.35 + cp.z*0.025); cp.xy *= mix(0.85,0.25,jetMask); cp.z += jetMask*axialWave*320.0; pathPosB=cp; pathScaleB = mix(baseScale, baseScale*2.0, jetMask); pathColorB = mix(baseColor, vec3(1.0,0.55,0.35), jetMask*0.75); }

  // Vortex (4)
  if(fromPathMode == 4){ vec3 cp=baseP; float r=length(cp.xy)+0.0001; float angle=atan(cp.y,cp.x)+time*0.18 + r*0.0009; float contraction=smoothstep(60.0,320.0,r); float inward=mix(1.0,0.25,contraction); cp.xy=inward*r*vec2(cos(angle),sin(angle)); cp.z += sin(r*0.04 - time*0.6)*18.0*contraction; pathPosA=cp; pathScaleA=baseScale*mix(1.0,0.65,contraction); pathColorA=mix(baseColor, vec3(0.6,0.75,1.0), contraction*0.6); }
  if(toPathMode == 4){ vec3 cp=baseP; float r=length(cp.xy)+0.0001; float angle=atan(cp.y,cp.x)+time*0.18 + r*0.0009; float contraction=smoothstep(60.0,320.0,r); float inward=mix(1.0,0.25,contraction); cp.xy=inward*r*vec2(cos(angle),sin(angle)); cp.z += sin(r*0.04 - time*0.6)*18.0*contraction; pathPosB=cp; pathScaleB=baseScale*mix(1.0,0.65,contraction); pathColorB=mix(baseColor, vec3(0.6,0.75,1.0), contraction*0.6); }

  // Shells (5)
  if(fromPathMode == 5){ vec3 cp=baseP; float r=length(cp); float bandFreq=0.09; float moving=sin(r*bandFreq*40.0 - time*2.0); float shellMask=smoothstep(0.3,0.95,abs(moving)); float targetOffset=sign(moving)*0.0 + (moving>0.0?1.0:-1.0); float adjust=(targetOffset-moving)*0.12; cp*=1.0+adjust*0.25; pathPosA=cp; pathScaleA=baseScale*mix(1.0,1.4,shellMask); pathColorA=mix(baseColor, vec3(0.9,0.85,1.0), shellMask*0.5); }
  if(toPathMode == 5){ vec3 cp=baseP; float r=length(cp); float bandFreq=0.09; float moving=sin(r*bandFreq*40.0 - time*2.0); float shellMask=smoothstep(0.3,0.95,abs(moving)); float targetOffset=sign(moving)*0.0 + (moving>0.0?1.0:-1.0); float adjust=(targetOffset-moving)*0.12; cp*=1.0+adjust*0.25; pathPosB=cp; pathScaleB=baseScale*mix(1.0,1.4,shellMask); pathColorB=mix(baseColor, vec3(0.9,0.85,1.0), shellMask*0.5); }

  // Neutron Star (6)
  if(fromPathMode == 6){ vec3 cp=baseP; float rXY=length(cp.xy)+0.0001; float core=smoothstep(0.0,80.0,rXY); cp.xy*=mix(0.35,1.0,core); float jetAxis=abs(cp.y); float jetMask=smoothstep(120.0,10.0,rXY)*smoothstep(40.0,400.0,jetAxis); cp.y += jetMask*sign(cp.y)*(140.0 + 60.0*sin(time*0.9)); float ang=atan(cp.y,cp.x)+time*0.05; float rr=length(cp.xy); cp.x=rr*cos(ang); cp.z=rr*sin(ang); float eq=1.0 - smoothstep(0.0,40.0,abs(cp.y)); vec3 coreColor=vec3(1.0,0.95,0.8); vec3 jetColor=vec3(0.9,0.55,1.0); pathPosA=cp; pathScaleA=baseScale*mix(1.2,0.6,core); pathScaleA=mix(pathScaleA,pathScaleA*2.2,jetMask); pathColorA=mix(baseColor, coreColor, core*0.8); pathColorA=mix(pathColorA, jetColor, jetMask*0.9); pathColorA=mix(pathColorA, vec3(0.5,0.8,1.0), eq*0.4); }
  if(toPathMode == 6){ vec3 cp=baseP; float rXY=length(cp.xy)+0.0001; float core=smoothstep(0.0,80.0,rXY); cp.xy*=mix(0.35,1.0,core); float jetAxis=abs(cp.y); float jetMask=smoothstep(120.0,10.0,rXY)*smoothstep(40.0,400.0,jetAxis); cp.y += jetMask*sign(cp.y)*(140.0 + 60.0*sin(time*0.9)); float ang=atan(cp.y,cp.x)+time*0.05; float rr=length(cp.xy); cp.x=rr*cos(ang); cp.z=rr*sin(ang); float eq=1.0 - smoothstep(0.0,40.0,abs(cp.y)); vec3 coreColor=vec3(1.0,0.95,0.8); vec3 jetColor=vec3(0.9,0.55,1.0); pathPosB=cp; pathScaleB=baseScale*mix(1.2,0.6,core); pathScaleB=mix(pathScaleB,pathScaleB*2.2,jetMask); pathColorB=mix(baseColor, coreColor, core*0.8); pathColorB=mix(pathColorB, jetColor, jetMask*0.9); pathColorB=mix(pathColorB, vec3(0.5,0.8,1.0), eq*0.4); }

  // Helix (7)
  if(fromPathMode == 7){ vec3 cp=baseP; float r=length(cp.xz)+0.0001; float angle=atan(cp.z,cp.x); float helixTurns=0.5 + time*0.15; r=mix(r,160.0,0.55); angle += helixTurns*0.35; cp.x=r*cos(angle); cp.z=r*sin(angle); float strandA=sin(angle*2.0 + time*1.2); float strandB=sin(angle*2.0 + 3.14159 + time*1.2); float blendAB=step(0.0, sin(angle + time*0.6)); float helixY=mix(strandA,strandB,blendAB)*180.0; cp.y=mix(cp.y,helixY,0.85); vec3 aColor=vec3(0.8,0.55,1.0); vec3 bColor=vec3(0.55,0.9,1.0); pathPosA=cp; pathScaleA=baseScale*1.15; pathColorA=mix(baseColor, mix(aColor,bColor,blendAB), 0.6); }
  if(toPathMode == 7){ vec3 cp=baseP; float r=length(cp.xz)+0.0001; float angle=atan(cp.z,cp.x); float helixTurns=0.5 + time*0.15; r=mix(r,160.0,0.55); angle += helixTurns*0.35; cp.x=r*cos(angle); cp.z=r*sin(angle); float strandA=sin(angle*2.0 + time*1.2); float strandB=sin(angle*2.0 + 3.14159 + time*1.2); float blendAB=step(0.0, sin(angle + time*0.6)); float helixY=mix(strandA,strandB,blendAB)*180.0; cp.y=mix(cp.y,helixY,0.85); vec3 aColor=vec3(0.8,0.55,1.0); vec3 bColor=vec3(0.55,0.9,1.0); pathPosB=cp; pathScaleB=baseScale*1.15; pathColorB=mix(baseColor, mix(aColor,bColor,blendAB), 0.6); }

  // Final interpolation between path A and B
  float pmx = clamp(pathMix, 0.0, 1.0);
  vec3 blendedPos = mix(pathPosA, pathPosB, pmx);
  float blendedScale = mix(pathScaleA, pathScaleB, pmx);
  vec3 blendedColor = mix(pathColorA, pathColorB, pmx);

  p = blendedPos;
  ptScale = blendedScale;
  vColor = blendedColor;
`;