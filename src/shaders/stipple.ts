export const vertexShader = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aSeed;

uniform float uProgress;
uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec2 uPointer;

varying float vAlpha;

float ease(float t) {
  return t * t * (3.0 - 2.0 * t);
}

void main() {
  float delay = (aSeed - 0.5) * 0.38;
  float p = clamp(uProgress * 1.38 - delay, 0.0, 1.0);
  p = ease(p);

  vec3 pos = mix(aFrom, aTo, p);
  float motion = sin(p * 3.14159265);

  float waveX = sin(pos.y * 5.8 + uTime * 1.05 + aSeed * 11.0);
  float waveY = cos(pos.x * 7.2 - uTime * 0.82 + aSeed * 15.0);
  pos.x += waveX * 0.045 * motion;
  pos.y += waveY * 0.032 * motion;
  pos.z += sin(aSeed * 24.0 + uTime * 1.2) * 0.08 * motion;

  vec2 delta = pos.xy - uPointer;
  float pointerFalloff = exp(-dot(delta, delta) * 2.2);
  pos.xy += normalize(delta + vec2(0.0001)) * pointerFalloff * 0.035;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uPointSize * uPixelRatio * (5.2 / -mvPosition.z);
  vAlpha = 0.86;
}
`

export const fragmentShader = /* glsl */ `
precision highp float;

varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = 1.0 - smoothstep(0.31, 0.5, d);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(0.075, 0.071, 0.064, alpha * vAlpha);
}
`
