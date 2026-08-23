export const vertexShader = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;

uniform float uProgress;
uniform float uPointSize;
uniform float uPixelRatio;

void main() {
  float scanOrder = ((300.0 - aFrom.y) + (aFrom.x + 300.0) * 0.25) / 750.0;
  float localProgress = clamp((uProgress - scanOrder * 0.25) / 0.75, 0.0, 1.0);
  float eased = 1.0 - pow(1.0 - localProgress, 4.0);
  float remaining = pow(1.0 - localProgress, 2.0);
  float wave = sin(localProgress * 3.14159265) * 1.6 * remaining;

  vec3 position = mix(aFrom, aTo, eased);
  position.x += sin((300.0 - aFrom.y) * 0.04 + uProgress * 6.2831853) * wave;
  position.y += cos((aFrom.x + 300.0) * 0.04 + uProgress * 6.2831853) * wave * 0.4;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uPointSize * uPixelRatio;
}
`

export const fragmentShader = /* glsl */ `
precision highp float;

void main() {
  vec2 centered = gl_PointCoord - 0.5;
  float distanceToCenter = length(centered);
  float alpha = 1.0 - smoothstep(0.42, 0.5, distanceToCenter);
  if (alpha <= 0.01) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`
