uniform vec3 grassColor;
uniform float time;
varying vec2 vUv;
varying float vHeight;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// Hash function - From Shadertoy
vec3 hash32(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yxz+33.33);
  return fract((p3.xxy+p3.yzz)*p3.zyx);
}

// SDF utility functions
float opSubtraction(float d1, float d2) {
   return max(d1, -d2);
 }

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

// 2D grass blade SDF (From Shadertoy)
float sdGrassBlade2d(vec2 p) {
  float dist = sdCircle(p - vec2(1.7, -1.3), 2.0);
  dist = opSubtraction(dist, sdCircle(p - vec2(1.7, -1.0), 1.8));
  dist = opSubtraction(dist, p.y + 1.0);
  dist = opSubtraction(dist, -p.x + 1.7);
  return dist;
}

void main() {
  // Transform UV space to [-1, 1] range
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= 1.2; // Slight stretch
  
  // Define grass blade part using SDF
  float d = sdGrassBlade2d(p * 2.0); // Scale adjustment
  
  // Calculate alpha based on distance field - create sharper edges
  float edge = 0.03; // Use smaller value for sharper edges
  
  // Hard edge processing - clearer boundary instead of smooth transition
  float alpha = smoothstep(edge, -edge, d);
  
  // Discard if alpha value is very low
  if (alpha < 0.15) discard; // Increased threshold
  
  // Color variation based on height
  vec3 topColor = grassColor * 1.2;  // Top color (brighter)
  vec3 bottomColor = grassColor * 0.8;  // Bottom color (darker)
  vec3 color = mix(bottomColor, topColor, vHeight);
  
  // Add slight texture to grass blade
  float windFactor = sin(vWorldPosition.x * 5.0 + time * 2.0) * 0.5 + 0.5;
  float textureFactor = mix(0.85, 1.0, windFactor * vHeight);
  color *= textureFactor;
  
  // Edge processing - make boundaries clearer
  alpha *= smoothstep(1.0, 0.8, abs(p.x));
  
  // Binary-like alpha processing - remove gray areas
  alpha = smoothstep(0.4, 0.6, alpha);
  
  gl_FragColor = vec4(color, alpha);
}