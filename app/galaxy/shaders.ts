export const fragmentSource = `
precision highp float;

uniform float globalAlpha;

varying float opacity;
uniform float superOpacity;
varying vec3 vColor;
varying float vScale;
// phaseMix: 0.0 = pure nebula, 1.0 = pure galaxy
uniform float phaseMix; // 0=nebula 1=galaxy
uniform float dyingMix; // 0=normal, 1=dying star condensed
uniform bool nebula; // legacy (ignored in new morph logic, retained for compatibility)
// (Removed duplicate dyingMix uniform declaration)
varying float depth;
varying float fogDepth;
uniform bool glow;
uniform float fdAlpha;

varying float vRing;
varying float vLevels;

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
  float depthOpacity = mix(.25, 1.0, depth);

  if(d < .001) discard;

  float op = d * opacity * globalAlpha * depthOpacity;

  vec3 finalColor = mix(vColor, mix(vColor, vec3(1.), .35), vRing);
  finalColor = mix(finalColor, vec3(0.), 1.0-fogDepth);

  finalColor = mix(finalColor, applyLevels(finalColor), vLevels);

  gl_FragColor = vec4(finalColor, op * fogDepth*superOpacity);
}
`;

export const vertexSource = `
precision highp float;

attribute vec2 uv;
attribute vec3 position;
uniform sampler2D posTex;
uniform sampler2D color;
uniform sampler2D scaleTex;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
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
uniform bool nebula;
uniform float phaseMix;

// Add missing dyingMix uniform for Dying Star phase
uniform float dyingMix;

varying float opacity;
varying vec3 vColor;
varying float vScale;
varying float depth;
varying float fogDepth;

uniform float focalDistance;
uniform float aperture;
uniform float maxParticleSize;

uniform vec3 tint;
uniform vec3 hoverPoint;
uniform float hover;

varying float vRing;
varying float vLevels;

// Simplex 3D Noise 
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

const vec2 TILE = vec2(1.0/8.0, -1.0/8.0);

vec3 getPosition(vec2 tc) {
  vec3 pos = texture2D(posTex, tc).rgb;
  vec3 p = vec3(-1.0) + 2.0 * pos;
  return p * scale;
}

vec2 getUVTile(float tile) {
  float x = mod(tile, 8.0) / 8.0;
  float y = 1.0-floor(tile/8.0) / 8.0;
  return vec2(x,y) + uv * TILE;
}

float qinticOut(float t) {
  return 1.0 - (pow(1.0-t, 5.0));
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453123);
}

const vec3 color1 = vec3(0.00, 0.14, 0.64);
const vec3 color2 = vec3(0.39, 0.52, 0.97);
const vec3 color3 = vec3(0.51, 0.17, 0.75);

const float hoverOpacity = .35;

uniform vec4 interaction;
uniform vec3 planets[8];
uniform float iRadius;

void main () {
  vec3 p = position;
  float ptScale = 1.0;
  // Initialize base color to avoid undefined mixes
  vColor = color1;

  // We compute nebula path only if fully nebula or during blend
  vec3 pNebula = p;
  float nebulaScale = ptScale;
  vec3 nebulaColor = color1;
  if(phaseMix < 0.999) {
    float pr = smoothstep(0., duration, time);
    float progress = qinticOut(pr);
    float tile = progress*63.0;
    float tile0 = floor(tile);
    float tile1 = ceil(tile);
    vec2 uv0 = getUVTile(tile0);
    vec2 uv1 = getUVTile(tile1);

    vec3 p1 = getPosition(uv0)*1000.;
    vec3 p2 = getPosition(uv1)*1000.;
    float t = fract(tile);
    pNebula = interpolate ? mix(p1, p2, t) : p1;

    vec4 color1 = texture2D(color, uv0);
    vec4 color2 = texture2D(color, uv1);
    vec4 _color = interpolate ? mix(color1, color2, t) : color1;
    nebulaColor = _color.rgb;
    
    nebulaScale = texture2D(scaleTex, uv).r;
    nebulaScale *= smoothstep(0. , .1, length(pNebula));

    vec3 pNoise;
    float amp = mix(nebulaAmp, nebulaAmp*.4, fade);
    float t2 = time * .08;
    pNoise.x = amp * snoise(vec3(position.xy*.01, t2));
    pNoise.z = amp * snoise(vec3(position.zy*.01, t2 *1.1));
    pNoise.y = pNoise.x;

    pNebula.z = mix(pNebula.z, pNebula.z + 45.0 * snoise(vec3(pNebula.xy * .0075, time *.01)), fdAlpha);

    float pt = smoothstep(.5, 1., progress);
    pNebula = mix(pNebula, pNebula+pNoise, pt);
  }

  // Galaxy path (always compute color for Dying Star phase)
  vec3 pGalaxy = p;
  float galaxyScale = ptScale;
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

  // Blend primary two phases
  float blend = clamp(phaseMix, 0.0, 1.0);
  vec3 baseP = mix(pNebula, pGalaxy, blend);
  float baseScale = mix(nebulaScale, galaxyScale, blend);
  vec3 baseColor = mix(nebulaColor, galaxyColor, blend);

  // Dying star (condensed nebula collapse toward origin, but use per-particle galaxy color distribution)
  if(dyingMix > 0.001) {
    float collapse = dyingMix; // linear ease for now
    // Pull positions toward origin and add inward noise swirl
    vec3 dsP = baseP;
    float swirlT = time * 0.2;
    dsP.xy += 40.0 * (1.0-collapse) * vec2(
      snoise(vec3(baseP.xy*0.02, swirlT)),
      snoise(vec3(baseP.yx*0.02, swirlT*1.1))
    );
  dsP *= mix(0.5, 0.2, collapse); // shrink further as dyingMix approaches 1
    // Scale intensifies and then diminishes
    float dsScale = baseScale * mix(1.5, 0.4, collapse);
  // Use the galaxyColor (from pGalaxy) for dying star color, to match Galaxy phase
  vec3 dsColor = galaxyColor;
  // Blend dying star on top
  p = mix(baseP, dsP, dyingMix);
  ptScale = mix(baseScale, dsScale, dyingMix);
  vColor = mix(baseColor, dsColor, dyingMix);
  } else {
    p = baseP;
    ptScale = baseScale;
    vColor = baseColor;
  }

  vLevels = step(10., length(p));

  if(fade > 0.0) {
    float d = smoothstep(0.0, 200.0, distance(vec3(0.), p));
    opacity = mix(1.0, d, fade);
  }
  else {
    opacity = 1.0;
  }

  vScale = ptScale;

  float t = time * .05;
  vec3 cN = .25 * vec3(
    snoise(vec3(position.xy * .1, t)),
    snoise(vec3(position.xz * .1, t)),
    snoise(vec3(position.yz * .1, t))
  );

  // hover tint
  vec3 hColor = vColor * hoverOpacity;
  vec4 worldPosition = modelMatrix * vec4(p, 1.0);
  float hPD = distance(hoverPoint, worldPosition.xyz);
  float hD = smoothstep(30.0, 80.0, hPD);
  hColor = mix(tint, hColor, hD);

  float opacity2 = mix(opacity, opacity * hoverOpacity, hD);
  opacity = mix(opacity, opacity2, hover);

  vColor = mix(vColor, tint + cN, fade);
  vColor = mix(vColor, hColor, hover);

  // Interaction and planets effects
  float iD = distance(worldPosition.xyz, interaction.xyz);
  float iR = mix(iRadius, iRadius/2.0, fade);
  float sId = 1.0 - smoothstep(iR, iR*2.5, iD);
  vec3 iV = normalize(interaction.xyz-worldPosition.xyz);

  float ringAngle = atan(position.y, position.x) + time;
  float ringY = 4.0 * snoise(vec3(position.xy, time*.1));
  vec3 ringPosition = interaction.xyz  + vec3(iR*sin(ringAngle), ringY, iR*cos(ringAngle));
  float ringX = 4.0 * snoise(vec3(position.xy, time*.1));
  vec3 ringPosition2 = interaction.xyz  + vec3(iR*sin(ringAngle), iR*cos(ringAngle), ringX);

  vec3 trPos = worldPosition.x<interaction.x ? ringPosition2 : ringPosition;

  worldPosition.xyz = mix(worldPosition.xyz, trPos, sId * interaction.w);

  // Planet interactions
  for(int i =0;i<8;++i){
    float iD = distance(worldPosition.xyz, planets[i].xyz);
    float iR = mix(iRadius, iRadius/2.0, fade);
    float sId = 1.0 - smoothstep(iR, iR*2.5, iD);
    vec3 iV = normalize(planets[i].xyz-worldPosition.xyz);

    float ringAngle = atan(position.y, position.x) + time;
    float ringY = 4.0 * snoise(vec3(position.xy, time*.1));
    vec3 ringPosition = planets[i].xyz  + vec3(iR*sin(ringAngle), ringY, iR*cos(ringAngle));
    float ringX = 4.0 * snoise(vec3(position.xy, time*.1));
    vec3 ringPosition2 = planets[i].xyz  + vec3(iR*sin(ringAngle), iR*cos(ringAngle), ringX);

    vec3 trPos = worldPosition.x<planets[i].x ? ringPosition2 : ringPosition;

    worldPosition.xyz = mix(worldPosition.xyz, trPos, sId);
    ptScale = mix(ptScale, ptScale*2.0, sId*interaction.w);
  }

  vRing = sId * interaction.w;
  
  vec4 mvPos = viewMatrix * worldPosition;

  float distanceToCamera = -mvPos.z;
  float fD = mix(focalDistance, 50.0, fdAlpha);
  float CoC = distance(distanceToCamera, fD);
  
  float ap = mix(aperture, 200.0, fdAlpha);

  depth = 1.0 - smoothstep(0.0, ap, CoC);
  ptScale = mix(ptScale, 4.0*ptScale, 1.0 - depth);
  ptScale = mix(ptScale, ptScale*2.0, sId*interaction.w);

  if(glow) {
    ptScale = mix(ptScale, ptScale*.5, fdAlpha);
    ptScale *=2.*superScale;
  }

  float near = mix(1000.0, 0., fdAlpha);
  float far = mix(1500.0, 525.0, fdAlpha);

  fogDepth = 1.0 - smoothstep(near, far, -mvPos.z);
  
  float maxS = mix(maxParticleSize, maxParticleSize*2.5, fade);
  gl_PointSize = ptScale * min(maxS, 1000.0 * size / (-mvPos.z));
  gl_Position = projectionMatrix * mvPos;
}
`;
