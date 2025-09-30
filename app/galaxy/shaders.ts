export const fragmentSource = `
precision highp float;

uniform float globalAlpha;

varying float opacity;
uniform float superOpacity;
varying vec3 vColor;
varying float vScale;
uniform float phaseMix;
uniform bool isNeutronStar2;
uniform bool stellarMode;
uniform float dyingMix;
uniform bool nebula;
varying float depth;
varying float fogDepth;
uniform bool glow;
uniform bool debugMode;
uniform float fdAlpha;

varying float vRing;
varying float vLevels;

uniform vec3 magneticAxis;
uniform float spinRate;
uniform float time;

const float inGamma = 1.0;
const float inWhite = 190.0;
const float inBlack = 10.0;

const float outBlack = 0.0;
const float outWhite = 250.0;

vec3 applyLevels(vec3 inPixel) {
  float r = (pow(((inPixel.r * 255.0) - inBlack) / (inWhite - inBlack), 1.0/inGamma) * (outWhite - outBlack) + outBlack) / 255.0; 
  float g = (pow(((inPixel.g * 255.0) - inBlack) / (inWhite - inBlack), 1.0/inGamma) * (outWhite - outBlack) + outBlack) / 255.0; 
  float b = (pow(((inPixel.b * 255.0) - inBlack) / (inWhite - inBlack), 1.0/inGamma) * (outWhite - outBlack) + outBlack) / 255.0; 
  return vec3(r,g,b);
}

void main () {
  vec2 st = vec2(-1.0) + 2.0 * gl_PointCoord.xy;
  float d = 1.0 - distance(st, vec2(0.));
  if(!glow) d = smoothstep(0., .25, d);
  else d = mix(d, smoothstep(0., .25, d), depth);
  if(debugMode){ d = smoothstep(0., .6, d); }
  float depthOpacity = mix(.25, 1.0, depth);
  if(d < .001) discard;
  float op = d * opacity * globalAlpha * depthOpacity;
  vec3 base = vColor;
  vec3 finalColor = mix(base, mix(base, vec3(1.), .35), vRing);
  if(debugMode){ finalColor = vec3(1.0); }
  finalColor = mix(finalColor, vec3(0.), 1.0-fogDepth);
  finalColor = mix(finalColor, applyLevels(finalColor), vLevels);
  gl_FragColor = vec4(finalColor, op * fogDepth*superOpacity);
}
`;

// Restored (trimmed) legacy vertex shader for Nebula / Galaxy / Dying Star
export const vertexSource = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform sampler2D posTex;
uniform sampler2D color;
uniform sampler2D scaleTex;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform float time;
uniform float duration;
uniform float envStart;
uniform bool interpolate;
uniform bool glow;
uniform float nebulaAmp;
uniform float fade;
uniform float fdAlpha;
uniform float superScale;
uniform float scale;
uniform float size;
uniform float phaseMix;
uniform float dyingMix;

uniform float focalDistance;
uniform float aperture;
uniform float maxParticleSize;
uniform vec3 tint;
uniform vec3 hoverPoint;
uniform float hover;
uniform vec4 interaction;
uniform vec3 planets[8];
uniform float iRadius;

varying float opacity;
varying vec3 vColor;
varying float vScale;
varying float depth;
varying float fogDepth;
varying float vRing;
varying float vLevels;

// Noise helpers (same as original)
vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;} 
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;} 
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);} 
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;} 
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

const vec2 TILE = vec2(1.0/8.0,-1.0/8.0);
vec3 getPosition(vec2 tc){vec3 pos=texture2D(posTex,tc).rgb;vec3 p=vec3(-1.0)+2.0*pos;return p*scale;}
vec2 getUVTile(float tile){float x=mod(tile,8.0)/8.0;float y=1.0-floor(tile/8.0)/8.0;return vec2(x,y)+uv*TILE;}
float qinticOut(float t){return 1.0-(pow(1.0-t,5.0));}
float rand(vec2 co){return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453123);}

const vec3 color1 = vec3(0.00,0.14,0.64);
const vec3 color2 = vec3(0.39,0.52,0.97);
const vec3 color3 = vec3(0.51,0.17,0.75);
const float hoverOpacity = .35;

void main(){
  vec3 p = position;
  float ptScale = 1.0;
  vColor = color1;

  // Nebula path
  vec3 pNebula = p; float nebulaScale = ptScale; vec3 nebulaColor = color1;
  if(phaseMix < 0.999){
    float pr = smoothstep(0., duration, time);
    float progress = qinticOut(pr);
    float tile = progress*63.0; float tile0=floor(tile); float tile1=ceil(tile); float t=fract(tile);
    vec2 uv0 = getUVTile(tile0); vec2 uv1 = getUVTile(tile1);
    vec4 nb0 = texture2D(color, uv0); vec4 nb1 = texture2D(color, uv1);
    vec4 _c = interpolate ? mix(nb0, nb1, t) : nb0; nebulaColor = _c.rgb;
    nebulaScale = texture2D(scaleTex, uv).r; nebulaScale *= smoothstep(0., .1, length(pNebula));
    vec3 pNoise; float amp = mix(nebulaAmp, nebulaAmp*.4, fade); float t2 = time*.08;
    pNoise.x = amp * snoise(vec3(position.xy*.01, t2));
    pNoise.z = amp * snoise(vec3(position.zy*.01, t2*1.1));
    pNoise.y = pNoise.x;
    pNebula.z = mix(pNebula.z, pNebula.z + 45.0 * snoise(vec3(pNebula.xy*.0075, time*.01)), fdAlpha);
    float pt = smoothstep(.5,1.,progress);
    pNebula = mix(pNebula, pNebula + pNoise, pt);
  }

  // Galaxy path (legacy motion & color only)
  vec3 pGalaxy = p; float galaxyScale = ptScale;
  float galaxyProgress = smoothstep(envStart, duration, time);
  float galaxyR = .5 * rand(position.xz*.01);
  galaxyProgress = smoothstep(galaxyR,1.,galaxyProgress);
  pGalaxy.x += 100.0 * sin(time*.01 + pGalaxy.x);
  pGalaxy.y += 100.0 * cos(time*.02 + pGalaxy.y);
  pGalaxy.z += 100.0 * sin(time*.026 + pGalaxy.z);
  galaxyProgress = qinticOut(galaxyProgress);
  galaxyScale *= smoothstep(0.0,0.2,galaxyProgress);
  pGalaxy *= galaxyProgress;
  float gR = length(pGalaxy.xy);
  vec3 galaxyColor = mix(color1, color2, smoothstep(0.,100.0,gR));
  galaxyColor = mix(galaxyColor, color3, smoothstep(100.,200.0,gR));

  // Blend phases
  float blend = clamp(phaseMix,0.0,1.0);
  vec3 baseP = mix(pNebula, pGalaxy, blend);
  float baseScale = mix(nebulaScale, galaxyScale, blend);
  vec3 baseColor = mix(nebulaColor, galaxyColor, blend);

  // Dying star collapse
  if(dyingMix > 0.001){
    float collapse = dyingMix;
    vec3 dsP = baseP;
    float swirlT = time * 0.2;
    dsP.xy += 40.0 * (1.0-collapse) * vec2(
      snoise(vec3(baseP.xy*0.02, swirlT)),
      snoise(vec3(baseP.yx*0.02, swirlT*1.1)));
    dsP *= mix(0.5,0.2,collapse);
    float dsScale = baseScale * mix(1.5,0.4,collapse);
    vec3 dsColor = galaxyColor;
    p = mix(baseP, dsP, dyingMix);
    ptScale = mix(baseScale, dsScale, dyingMix);
    vColor = mix(baseColor, dsColor, dyingMix);
  } else {
    p = baseP; ptScale = baseScale; vColor = baseColor;
  }

  vLevels = step(10., length(p));
  if(fade > 0.0){ float d = smoothstep(0.0, 200.0, length(p)); opacity = mix(1.0, d, fade);} else { opacity = 1.0; }
  vScale = ptScale;

  // Noise-based subtle color variation (restored)
  float tN = time * .05;
  vec3 cN = .25 * vec3(
    snoise(vec3(position.xy * .1, tN)),
    snoise(vec3(position.xz * .1, tN)),
    snoise(vec3(position.yz * .1, tN))
  );

  vec4 worldPosition = modelMatrix * vec4(p,1.0);
  float hPD = distance(hoverPoint, worldPosition.xyz);
  float hD = smoothstep(30.0, 80.0, hPD);
  vec3 hColor = vColor * hoverOpacity;
  hColor = mix(tint, hColor, hD);
  float opacity2 = mix(opacity, opacity * hoverOpacity, hD);
  opacity = mix(opacity, opacity2, hover);
  vColor = mix(vColor, tint + cN, fade);
  vColor = mix(vColor, hColor, hover);

  // --- Restored interaction & planet ring orbit shaping ---
  float iD = distance(worldPosition.xyz, interaction.xyz);
  float iR = mix(iRadius, iRadius/2.0, fade);
  float sId = 1.0 - smoothstep(iR, iR*2.5, iD);
  float ringAngle = atan(position.y, position.x) + time; // restored original basis
  float ringY = 4.0 * snoise(vec3(p.xy, time*.1));
  vec3 ringPosition = interaction.xyz + vec3(iR*sin(ringAngle), ringY, iR*cos(ringAngle));
  float ringX = 4.0 * snoise(vec3(p.xy, time*.1));
  vec3 ringPosition2 = interaction.xyz + vec3(iR*sin(ringAngle), iR*cos(ringAngle), ringX);
  vec3 trPos = worldPosition.x<interaction.x ? ringPosition2 : ringPosition;
  worldPosition.xyz = mix(worldPosition.xyz, trPos, sId * interaction.w);
  // Planet loops
  for(int pi=0; pi<8; ++pi){
    float pDist = distance(worldPosition.xyz, planets[pi].xyz);
    float pR = mix(iRadius, iRadius/2.0, fade);
    float pId = 1.0 - smoothstep(pR, pR*2.5, pDist);
  float pAngle = atan(position.y, position.x) + time;
    float pRingY = 4.0 * snoise(vec3(p.xy, time*.1));
    vec3 pRingPos = planets[pi].xyz + vec3(pR*sin(pAngle), pRingY, pR*cos(pAngle));
    float pRingX = 4.0 * snoise(vec3(p.xy, time*.1));
    vec3 pRingPos2 = planets[pi].xyz + vec3(pR*sin(pAngle), pR*cos(pAngle), pRingX);
    vec3 pTr = worldPosition.x<planets[pi].x ? pRingPos2 : pRingPos;
    worldPosition.xyz = mix(worldPosition.xyz, pTr, pId);
    ptScale = mix(ptScale, ptScale*2.0, pId * interaction.w);
  }
  vRing = sId * interaction.w;

  vec4 mvPos = viewMatrix * worldPosition;
  float distanceToCamera = -mvPos.z;
  float fD = mix(focalDistance, 50.0, fdAlpha);
  float CoC = distance(distanceToCamera, fD);
  float ap = mix(aperture, 200.0, fdAlpha);
  depth = 1.0 - smoothstep(0.0, ap, CoC);
  ptScale = mix(ptScale, 4.0*ptScale, 1.0 - depth);
  // Depth of field result already applied; reinforce ring scale boost after DoF like legacy
  ptScale = mix(ptScale, ptScale*2.0, sId*interaction.w);
  if(glow){ ptScale = mix(ptScale, ptScale*.5, fdAlpha); ptScale *=2.*superScale; }
  float near = mix(1000.0, 0., fdAlpha);
  float far = mix(1500.0, 525.0, fdAlpha);
  fogDepth = 1.0 - smoothstep(near, far, -mvPos.z);
  float maxS = mix(maxParticleSize, maxParticleSize*2.5, fade);
  gl_PointSize = ptScale * min(maxS, 1000.0 * size / (-mvPos.z));
  gl_Position = projectionMatrix * mvPos;
}
`;
