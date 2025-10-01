// Additional path variants: Spiral, Aurora Bloom, Jets, Vortex, Crystal Weave, Chrono Streams, Helix,
// Lunar Halo Drift, Crescent Arcway, Tidal Stream Bands, Pillar Glow Columns, Lagoon Mist Sheet,
// Star Nursery Cluster, Dust Lane Veil, Ice Coma Bloom, Aurora Veil Curtain, Binary Glow Orbit
// Controlled by uniform extraPathMode
// 0=Base,1=Spiral,2=AuroraBloom,3=Jets,4=Vortex,5=CrystalWeave,6=ChronoStreams,7=Helix,
// 8=LunarHaloDrift,9=CrescentArcway,10=TidalStreamBands,11=PillarGlowColumns,12=LagoonMistSheet,
// 13=StarNurseryCluster,14=DustLaneVeil,15=IceComaBloom,16=AuroraVeilCurtain,17=BinaryGlowOrbit
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

  // Aurora Bloom (2)
  if(fromPathMode == 2){
    vec3 cp = baseP;
    float r = length(cp.xy) + 0.0001;
    float angle = atan(cp.y, cp.x);
    float petals = 6.0;
    float petalWave = sin(angle * petals + time * 0.9);
    float verticalSweep = cos(r * 0.012 - time * 0.6);
    float radialStretch = mix(0.45, 1.35, abs(petalWave));
    float angularOffset = petalWave * 0.22;
    float newR = r * radialStretch;
    cp.x = newR * cos(angle + angularOffset);
    cp.y = newR * sin(angle + angularOffset);
    cp.z += verticalSweep * petalWave * 160.0;
    float bloomMix = smoothstep(-0.4, 0.4, petalWave);
    vec3 auroraA = vec3(0.52, 0.82, 1.0);
    vec3 auroraB = vec3(0.78, 1.0, 0.68);
    pathPosA = cp;
    pathScaleA = baseScale * mix(0.75, 1.85, abs(petalWave));
    pathColorA = mix(baseColor, mix(auroraA, auroraB, bloomMix), 0.65);
  }
  if(toPathMode == 2){
    vec3 cp = baseP;
    float r = length(cp.xy) + 0.0001;
    float angle = atan(cp.y, cp.x);
    float petals = 6.0;
    float petalWave = sin(angle * petals + time * 0.9);
    float verticalSweep = cos(r * 0.012 - time * 0.6);
    float radialStretch = mix(0.45, 1.35, abs(petalWave));
    float angularOffset = petalWave * 0.22;
    float newR = r * radialStretch;
    cp.x = newR * cos(angle + angularOffset);
    cp.y = newR * sin(angle + angularOffset);
    cp.z += verticalSweep * petalWave * 160.0;
    float bloomMix = smoothstep(-0.4, 0.4, petalWave);
    vec3 auroraA = vec3(0.52, 0.82, 1.0);
    vec3 auroraB = vec3(0.78, 1.0, 0.68);
    pathPosB = cp;
    pathScaleB = baseScale * mix(0.75, 1.85, abs(petalWave));
    pathColorB = mix(baseColor, mix(auroraA, auroraB, bloomMix), 0.65);
  }

  // Jets (3)
  if(fromPathMode == 3){ vec3 cp=baseP; float radial=length(cp.xy); float jetMask=smoothstep(140.0,25.0,radial); float axialWave=sin(time*0.35 + cp.z*0.025); cp.xy *= mix(0.85,0.25,jetMask); cp.z += jetMask*axialWave*320.0; pathPosA=cp; pathScaleA = mix(baseScale, baseScale*2.0, jetMask); pathColorA = mix(baseColor, vec3(1.0,0.55,0.35), jetMask*0.75); }
  if(toPathMode == 3){ vec3 cp=baseP; float radial=length(cp.xy); float jetMask=smoothstep(140.0,25.0,radial); float axialWave=sin(time*0.35 + cp.z*0.025); cp.xy *= mix(0.85,0.25,jetMask); cp.z += jetMask*axialWave*320.0; pathPosB=cp; pathScaleB = mix(baseScale, baseScale*2.0, jetMask); pathColorB = mix(baseColor, vec3(1.0,0.55,0.35), jetMask*0.75); }

  // Vortex (4)
  if(fromPathMode == 4){ vec3 cp=baseP; float r=length(cp.xy)+0.0001; float angle=atan(cp.y,cp.x)+time*0.18 + r*0.0009; float contraction=smoothstep(60.0,320.0,r); float inward=mix(1.0,0.25,contraction); cp.xy=inward*r*vec2(cos(angle),sin(angle)); cp.z += sin(r*0.04 - time*0.6)*18.0*contraction; pathPosA=cp; pathScaleA=baseScale*mix(1.0,0.65,contraction); pathColorA=mix(baseColor, vec3(0.6,0.75,1.0), contraction*0.6); }
  if(toPathMode == 4){ vec3 cp=baseP; float r=length(cp.xy)+0.0001; float angle=atan(cp.y,cp.x)+time*0.18 + r*0.0009; float contraction=smoothstep(60.0,320.0,r); float inward=mix(1.0,0.25,contraction); cp.xy=inward*r*vec2(cos(angle),sin(angle)); cp.z += sin(r*0.04 - time*0.6)*18.0*contraction; pathPosB=cp; pathScaleB=baseScale*mix(1.0,0.65,contraction); pathColorB=mix(baseColor, vec3(0.6,0.75,1.0), contraction*0.6); }

  // Crystal Weave (5)
  if(fromPathMode == 5){
    vec3 cp = baseP;
    float radial = length(cp) + 0.0001;
    float lattice = sin(cp.x * 0.028 + time * 0.85) * sin(cp.y * 0.031 - time * 0.6) * sin(cp.z * 0.026 + time * 0.95);
    float weaveMask = smoothstep(0.18, 0.82, abs(lattice));
    vec3 dir = cp;
    float dirLen = max(length(dir), 0.0001);
    dir /= dirLen;
    float radialPulse = sin(radial * 0.035 - time * 1.4);
    cp += dir * (weaveMask * 42.0 * radialPulse);
    cp *= mix(0.72, 1.32, weaveMask);
    vec3 crystalTint = vec3(0.88, 0.97, 1.0);
    vec3 emeraldTint = vec3(0.72, 1.0, 0.86);
    pathPosA = cp;
    pathScaleA = baseScale * mix(0.85, 1.95, weaveMask);
    pathColorA = mix(baseColor, mix(crystalTint, emeraldTint, weaveMask), 0.6);
  }
  if(toPathMode == 5){
    vec3 cp = baseP;
    float radial = length(cp) + 0.0001;
    float lattice = sin(cp.x * 0.028 + time * 0.85) * sin(cp.y * 0.031 - time * 0.6) * sin(cp.z * 0.026 + time * 0.95);
    float weaveMask = smoothstep(0.18, 0.82, abs(lattice));
    vec3 dir = cp;
    float dirLen = max(length(dir), 0.0001);
    dir /= dirLen;
    float radialPulse = sin(radial * 0.035 - time * 1.4);
    cp += dir * (weaveMask * 42.0 * radialPulse);
    cp *= mix(0.72, 1.32, weaveMask);
    vec3 crystalTint = vec3(0.88, 0.97, 1.0);
    vec3 emeraldTint = vec3(0.72, 1.0, 0.86);
    pathPosB = cp;
    pathScaleB = baseScale * mix(0.85, 1.95, weaveMask);
    pathColorB = mix(baseColor, mix(crystalTint, emeraldTint, weaveMask), 0.6);
  }

  // Chrono Streams (6)
  if(fromPathMode == 6){
    vec3 cp = baseP;
    float rXY = length(cp.xy) + 0.0001;
    float angle = atan(cp.y, cp.x);
    float streamWave = sin(angle * 3.6 + time * 0.95);
    float ribbon = cos(cp.z * 0.018 + time * 0.75) + sin(rXY * 0.02 - time * 1.15);
    float ribbonMix = clamp(0.5 + 0.5 * ribbon, 0.0, 1.0);
    float radialShear = mix(0.4, 1.45, ribbonMix);
    float angularOffset = streamWave * 0.28;
    float newR = rXY * radialShear;
    cp.x = newR * cos(angle + angularOffset);
    cp.y = newR * sin(angle + angularOffset);
    cp.z += ribbon * 210.0 + sin(angle * 4.0 + time * 1.2) * 80.0;
    float glow = smoothstep(0.1, 0.85, abs(streamWave));
    vec3 magenta = vec3(1.0, 0.66, 0.95);
    vec3 cyan = vec3(0.55, 0.85, 1.0);
    pathPosA = cp;
    pathScaleA = baseScale * mix(0.7, 2.2, glow * 0.6 + ribbonMix * 0.4);
    pathColorA = mix(baseColor, mix(cyan, magenta, glow), 0.7);
  }
  if(toPathMode == 6){
    vec3 cp = baseP;
    float rXY = length(cp.xy) + 0.0001;
    float angle = atan(cp.y, cp.x);
    float streamWave = sin(angle * 3.6 + time * 0.95);
    float ribbon = cos(cp.z * 0.018 + time * 0.75) + sin(rXY * 0.02 - time * 1.15);
    float ribbonMix = clamp(0.5 + 0.5 * ribbon, 0.0, 1.0);
    float radialShear = mix(0.4, 1.45, ribbonMix);
    float angularOffset = streamWave * 0.28;
    float newR = rXY * radialShear;
    cp.x = newR * cos(angle + angularOffset);
    cp.y = newR * sin(angle + angularOffset);
    cp.z += ribbon * 210.0 + sin(angle * 4.0 + time * 1.2) * 80.0;
    float glow = smoothstep(0.1, 0.85, abs(streamWave));
    vec3 magenta = vec3(1.0, 0.66, 0.95);
    vec3 cyan = vec3(0.55, 0.85, 1.0);
    pathPosB = cp;
    pathScaleB = baseScale * mix(0.7, 2.2, glow * 0.6 + ribbonMix * 0.4);
    pathColorB = mix(baseColor, mix(cyan, magenta, glow), 0.7);
  }

  // Helix (7)
  if(fromPathMode == 7){ vec3 cp=baseP; float r=length(cp.xz)+0.0001; float angle=atan(cp.z,cp.x); float helixTurns=0.5 + time*0.15; r=mix(r,160.0,0.55); angle += helixTurns*0.35; cp.x=r*cos(angle); cp.z=r*sin(angle); float strandA=sin(angle*2.0 + time*1.2); float strandB=sin(angle*2.0 + 3.14159 + time*1.2); float blendAB=step(0.0, sin(angle + time*0.6)); float helixY=mix(strandA,strandB,blendAB)*180.0; cp.y=mix(cp.y,helixY,0.85); vec3 aColor=vec3(0.8,0.55,1.0); vec3 bColor=vec3(0.55,0.9,1.0); pathPosA=cp; pathScaleA=baseScale*1.15; pathColorA=mix(baseColor, mix(aColor,bColor,blendAB), 0.6); }
  if(toPathMode == 7){ vec3 cp=baseP; float r=length(cp.xz)+0.0001; float angle=atan(cp.z,cp.x); float helixTurns=0.5 + time*0.15; r=mix(r,160.0,0.55); angle += helixTurns*0.35; cp.x=r*cos(angle); cp.z=r*sin(angle); float strandA=sin(angle*2.0 + time*1.2); float strandB=sin(angle*2.0 + 3.14159 + time*1.2); float blendAB=step(0.0, sin(angle + time*0.6)); float helixY=mix(strandA,strandB,blendAB)*180.0; cp.y=mix(cp.y,helixY,0.85); vec3 aColor=vec3(0.8,0.55,1.0); vec3 bColor=vec3(0.55,0.9,1.0); pathPosB=cp; pathScaleB=baseScale*1.15; pathColorB=mix(baseColor, mix(aColor,bColor,blendAB), 0.6); }

  // Lunar Halo Drift (8)
  if(fromPathMode == 8){ vec3 cp=baseP; float r=length(cp.xy)+0.0001; float angle=atan(cp.y,cp.x); float haloRadius=mix(r,220.0,0.5); float drift=sin(time*0.32 + r*0.01); float lift=cos(angle*2.0 + time*0.45)*0.4; cp.x=haloRadius*cos(angle); cp.y=haloRadius*sin(angle); cp.z=mix(cp.z, drift*55.0 + lift*40.0, 0.4); float softness=smoothstep(40.0,260.0,r); pathPosA=cp; pathScaleA=baseScale*mix(0.9,1.2,softness); vec3 moonTint=vec3(0.64,0.72,0.95); vec3 haloColor=vec3(0.78,0.84,1.0); float colorMix=0.35 + 0.35*softness; pathColorA=mix(baseColor, mix(moonTint, haloColor, softness), colorMix); }
  if(toPathMode == 8){ vec3 cp=baseP; float r=length(cp.xy)+0.0001; float angle=atan(cp.y,cp.x); float haloRadius=mix(r,220.0,0.5); float drift=sin(time*0.32 + r*0.01); float lift=cos(angle*2.0 + time*0.45)*0.4; cp.x=haloRadius*cos(angle); cp.y=haloRadius*sin(angle); cp.z=mix(cp.z, drift*55.0 + lift*40.0, 0.4); float softness=smoothstep(40.0,260.0,r); pathPosB=cp; pathScaleB=baseScale*mix(0.9,1.2,softness); vec3 moonTint=vec3(0.64,0.72,0.95); vec3 haloColor=vec3(0.78,0.84,1.0); float colorMix=0.35 + 0.35*softness; pathColorB=mix(baseColor, mix(moonTint, haloColor, softness), colorMix); }

  // Crescent Arcway (9)
  if(fromPathMode == 9){ vec3 cp=baseP; float angle=atan(cp.y,cp.x); float r=length(cp.xy)+0.0001; float cres=0.5 + 0.5*sin(angle - time*0.2); float arcGate=smoothstep(0.2,0.85,cres); float newR=mix(r*0.65, mix(r,240.0,0.4), arcGate); float offset=mix(-0.45,0.15,arcGate)*0.6; cp.x=newR*cos(angle + offset); cp.y=newR*sin(angle + offset); cp.z=mix(cp.z, sin(angle*1.5 + time*0.35)*75.0*arcGate, 0.45); float glow=mix(0.2,0.7,arcGate); pathPosA=cp; pathScaleA=baseScale*mix(0.88,1.18,glow); vec3 sand=vec3(0.95,0.86,0.70); vec3 bronze=vec3(1.0,0.78,0.58); pathColorA=mix(baseColor, mix(sand, bronze, glow), 0.5); }
  if(toPathMode == 9){ vec3 cp=baseP; float angle=atan(cp.y,cp.x); float r=length(cp.xy)+0.0001; float cres=0.5 + 0.5*sin(angle - time*0.2); float arcGate=smoothstep(0.2,0.85,cres); float newR=mix(r*0.65, mix(r,240.0,0.4), arcGate); float offset=mix(-0.45,0.15,arcGate)*0.6; cp.x=newR*cos(angle + offset); cp.y=newR*sin(angle + offset); cp.z=mix(cp.z, sin(angle*1.5 + time*0.35)*75.0*arcGate, 0.45); float glow=mix(0.2,0.7,arcGate); pathPosB=cp; pathScaleB=baseScale*mix(0.88,1.18,glow); vec3 sand=vec3(0.95,0.86,0.70); vec3 bronze=vec3(1.0,0.78,0.58); pathColorB=mix(baseColor, mix(sand, bronze, glow), 0.5); }

  // Tidal Stream Bands (10)
  if(fromPathMode == 10){ vec3 cp=baseP; float bandWave=sin(cp.y*0.016 + time*0.3); float sway=cos(cp.x*0.008 - time*0.25); cp.x += sway*40.0; cp.z=mix(cp.z, bandWave*120.0, 0.4); cp.y *= mix(0.9,0.75,abs(bandWave)); float bandMix=0.5 + 0.5*bandWave; pathPosA=cp; pathScaleA=baseScale*mix(0.9,1.35,abs(bandWave)*0.6 + 0.2); vec3 deep=vec3(0.36,0.65,0.95); vec3 aqua=vec3(0.56,0.80,1.0); pathColorA=mix(baseColor, mix(deep, aqua, bandMix), 0.55); }
  if(toPathMode == 10){ vec3 cp=baseP; float bandWave=sin(cp.y*0.016 + time*0.3); float sway=cos(cp.x*0.008 - time*0.25); cp.x += sway*40.0; cp.z=mix(cp.z, bandWave*120.0, 0.4); cp.y *= mix(0.9,0.75,abs(bandWave)); float bandMix=0.5 + 0.5*bandWave; pathPosB=cp; pathScaleB=baseScale*mix(0.9,1.35,abs(bandWave)*0.6 + 0.2); vec3 deep=vec3(0.36,0.65,0.95); vec3 aqua=vec3(0.56,0.80,1.0); pathColorB=mix(baseColor, mix(deep, aqua, bandMix), 0.55); }

  // Pillar Glow Columns (11)
  if(fromPathMode == 11){ vec3 cp=baseP; float spacing=160.0; float index=floor((cp.x+640.0)/spacing); float center=index*spacing - 640.0 + spacing*0.5; float offset=cp.x-center; float column=exp(-0.5*pow(offset/60.0,2.0)); cp.x=mix(cp.x, center, 0.75); cp.y = cp.y*mix(1.0,1.35,column) + sin(time*0.45 + index*0.7)*90.0*column; cp.z += cos(time*0.3 + index*1.1)*120.0*column; float glow=clamp(column,0.0,1.0); pathPosA=cp; pathScaleA=baseScale*mix(0.9,1.7,glow); vec3 lavender=vec3(0.68,0.76,1.0); vec3 amethyst=vec3(0.78,0.68,1.0); pathColorA=mix(baseColor, mix(lavender, amethyst, glow), 0.58); }
  if(toPathMode == 11){ vec3 cp=baseP; float spacing=160.0; float index=floor((cp.x+640.0)/spacing); float center=index*spacing - 640.0 + spacing*0.5; float offset=cp.x-center; float column=exp(-0.5*pow(offset/60.0,2.0)); cp.x=mix(cp.x, center, 0.75); cp.y = cp.y*mix(1.0,1.35,column) + sin(time*0.45 + index*0.7)*90.0*column; cp.z += cos(time*0.3 + index*1.1)*120.0*column; float glow=clamp(column,0.0,1.0); pathPosB=cp; pathScaleB=baseScale*mix(0.9,1.7,glow); vec3 lavender=vec3(0.68,0.76,1.0); vec3 amethyst=vec3(0.78,0.68,1.0); pathColorB=mix(baseColor, mix(lavender, amethyst, glow), 0.58); }

  // Lagoon Mist Sheet (12)
  if(fromPathMode == 12){ vec3 cp=baseP; float sheet=sin(cp.x*0.012 + time*0.4) + cos(cp.y*0.008 - time*0.35); cp.z=mix(cp.z, sheet*60.0, 0.6); cp.y=mix(cp.y, cp.y*0.55, 0.65); cp.x *= 1.05; float mist=0.5 + 0.5*clamp(sheet*0.65, -1.0, 1.0); pathPosA=cp; pathScaleA=baseScale*mix(0.85,1.3,abs(sheet)*0.35 + 0.25); vec3 teal=vec3(0.36,0.70,0.95); vec3 aqua=vec3(0.55,0.88,1.0); pathColorA=mix(baseColor, mix(teal, aqua, mist), 0.5); }
  if(toPathMode == 12){ vec3 cp=baseP; float sheet=sin(cp.x*0.012 + time*0.4) + cos(cp.y*0.008 - time*0.35); cp.z=mix(cp.z, sheet*60.0, 0.6); cp.y=mix(cp.y, cp.y*0.55, 0.65); cp.x *= 1.05; float mist=0.5 + 0.5*clamp(sheet*0.65, -1.0, 1.0); pathPosB=cp; pathScaleB=baseScale*mix(0.85,1.3,abs(sheet)*0.35 + 0.25); vec3 teal=vec3(0.36,0.70,0.95); vec3 aqua=vec3(0.55,0.88,1.0); pathColorB=mix(baseColor, mix(teal, aqua, mist), 0.5); }

  // Star Nursery Cluster (13)
  if(fromPathMode == 13){ vec3 cp=baseP; float clump=snoise(cp*0.015 + vec3(time*0.2, time*0.18, time*0.16)); float density=smoothstep(0.05,0.55,clump); float dirLen=max(length(cp),0.0001); vec3 dir=cp/dirLen; cp *= mix(0.9,0.55,density); cp += dir*(density*45.0); cp.z += sin(time*0.4 + clump*3.0)*35.0*density; float glow=mix(0.2,0.75,density); pathPosA=cp; pathScaleA=baseScale*mix(0.95,1.6,glow); vec3 amber=vec3(1.0,0.82,0.65); vec3 rose=vec3(1.0,0.68,0.74); pathColorA=mix(baseColor, mix(rose, amber, glow), 0.58); }
  if(toPathMode == 13){ vec3 cp=baseP; float clump=snoise(cp*0.015 + vec3(time*0.2, time*0.18, time*0.16)); float density=smoothstep(0.05,0.55,clump); float dirLen=max(length(cp),0.0001); vec3 dir=cp/dirLen; cp *= mix(0.9,0.55,density); cp += dir*(density*45.0); cp.z += sin(time*0.4 + clump*3.0)*35.0*density; float glow=mix(0.2,0.75,density); pathPosB=cp; pathScaleB=baseScale*mix(0.95,1.6,glow); vec3 amber=vec3(1.0,0.82,0.65); vec3 rose=vec3(1.0,0.68,0.74); pathColorB=mix(baseColor, mix(rose, amber, glow), 0.58); }

  // Dust Lane Veil (14)
  if(fromPathMode == 14){ vec3 cp=baseP; float lane=exp(-abs(cp.z)/140.0); cp.z=mix(cp.z, cp.z*0.3, 0.7); cp.y=mix(cp.y, cp.y*0.65, lane); cp.x *= mix(1.0,1.15,lane); float dust=mix(0.25,0.8,lane); pathPosA=cp; pathScaleA=baseScale*mix(0.8,1.1,dust); vec3 dusk=vec3(0.58,0.54,0.48); vec3 amberDust=vec3(0.7,0.6,0.45); pathColorA=mix(baseColor, mix(dusk, amberDust, dust), 0.45); }
  if(toPathMode == 14){ vec3 cp=baseP; float lane=exp(-abs(cp.z)/140.0); cp.z=mix(cp.z, cp.z*0.3, 0.7); cp.y=mix(cp.y, cp.y*0.65, lane); cp.x *= mix(1.0,1.15,lane); float dust=mix(0.25,0.8,lane); pathPosB=cp; pathScaleB=baseScale*mix(0.8,1.1,dust); vec3 dusk=vec3(0.58,0.54,0.48); vec3 amberDust=vec3(0.7,0.6,0.45); pathColorB=mix(baseColor, mix(dusk, amberDust, dust), 0.45); }

  // Ice Coma Bloom (15)
  if(fromPathMode == 15){ vec3 cp=baseP; vec3 dir=normalize(vec3(1.0,0.0,0.2)); float forward=dot(cp, dir); float bloom=exp(-abs(forward)/260.0); cp += dir*(120.0*bloom); cp *= mix(0.92,1.18,bloom); cp.y += sin(time*0.28 + forward*0.01)*40.0*bloom; float glow=mix(0.35,0.75,bloom); pathPosA=cp; pathScaleA=baseScale*mix(0.95,1.4,glow); vec3 ice=vec3(0.72,0.90,1.0); vec3 frost=vec3(0.82,0.95,1.0); pathColorA=mix(baseColor, mix(ice, frost, glow), 0.55); }
  if(toPathMode == 15){ vec3 cp=baseP; vec3 dir=normalize(vec3(1.0,0.0,0.2)); float forward=dot(cp, dir); float bloom=exp(-abs(forward)/260.0); cp += dir*(120.0*bloom); cp *= mix(0.92,1.18,bloom); cp.y += sin(time*0.28 + forward*0.01)*40.0*bloom; float glow=mix(0.35,0.75,bloom); pathPosB=cp; pathScaleB=baseScale*mix(0.95,1.4,glow); vec3 ice=vec3(0.72,0.90,1.0); vec3 frost=vec3(0.82,0.95,1.0); pathColorB=mix(baseColor, mix(ice, frost, glow), 0.55); }

  // Aurora Veil Curtain (16)
  if(fromPathMode == 16){ vec3 cp=baseP; float wave=sin(cp.z*0.02 + time*0.8); float height=cos(cp.y*0.015 + time*0.35); cp.x=mix(cp.x, wave*180.0, 0.65); cp.y += height*45.0; cp.z *= 1.05; float glow=0.5 + 0.5*clamp(wave*0.8, -1.0, 1.0); pathPosA=cp; pathScaleA=baseScale*mix(0.9,1.5,abs(wave)*0.5 + 0.2); vec3 violet=vec3(0.58,0.68,1.0); vec3 emerald=vec3(0.45,0.85,0.95); pathColorA=mix(baseColor, mix(violet, emerald, glow), 0.6); }
  if(toPathMode == 16){ vec3 cp=baseP; float wave=sin(cp.z*0.02 + time*0.8); float height=cos(cp.y*0.015 + time*0.35); cp.x=mix(cp.x, wave*180.0, 0.65); cp.y += height*45.0; cp.z *= 1.05; float glow=0.5 + 0.5*clamp(wave*0.8, -1.0, 1.0); pathPosB=cp; pathScaleB=baseScale*mix(0.9,1.5,abs(wave)*0.5 + 0.2); vec3 violet=vec3(0.58,0.68,1.0); vec3 emerald=vec3(0.45,0.85,0.95); pathColorB=mix(baseColor, mix(violet, emerald, glow), 0.6); }

  // Binary Glow Orbit (17)
  if(fromPathMode == 17){ vec3 cp=baseP; float r=length(cp.xz)+0.0001; float angle=atan(cp.z,cp.x); float orbitRadius=mix(r,190.0,0.45); float binaryPhase=sin(angle*2.0 + time*0.4); float centerOffset=binaryPhase*120.0; cp.x=mix(cp.x, orbitRadius*cos(angle) + centerOffset, 0.7); cp.z=mix(cp.z, orbitRadius*sin(angle)*0.85, 0.7); cp.y += cos(angle*1.5 + time*0.6)*60.0; float glow=0.5 + 0.5*sin(time*0.35 + angle*1.2); pathPosA=cp; pathScaleA=baseScale*mix(0.95,1.35,abs(glow-0.5)*1.2 + 0.2); vec3 blush=vec3(1.0,0.72,0.88); vec3 azure=vec3(0.65,0.78,1.0); pathColorA=mix(baseColor, mix(azure, blush, glow*0.5+0.5), 0.6); }
  if(toPathMode == 17){ vec3 cp=baseP; float r=length(cp.xz)+0.0001; float angle=atan(cp.z,cp.x); float orbitRadius=mix(r,190.0,0.45); float binaryPhase=sin(angle*2.0 + time*0.4); float centerOffset=binaryPhase*120.0; cp.x=mix(cp.x, orbitRadius*cos(angle) + centerOffset, 0.7); cp.z=mix(cp.z, orbitRadius*sin(angle)*0.85, 0.7); cp.y += cos(angle*1.5 + time*0.6)*60.0; float glow=0.5 + 0.5*sin(time*0.35 + angle*1.2); pathPosB=cp; pathScaleB=baseScale*mix(0.95,1.35,abs(glow-0.5)*1.2 + 0.2); vec3 blush=vec3(1.0,0.72,0.88); vec3 azure=vec3(0.65,0.78,1.0); pathColorB=mix(baseColor, mix(azure, blush, glow*0.5+0.5), 0.6); }

  // Final interpolation between path A and B
  float pmx = clamp(pathMix, 0.0, 1.0);
  vec3 blendedPos = mix(pathPosA, pathPosB, pmx);
  float blendedScale = mix(pathScaleA, pathScaleB, pmx);
  vec3 blendedColor = mix(pathColorA, pathColorB, pmx);

  p = blendedPos;
  ptScale = blendedScale;
  vColor = blendedColor;
`;