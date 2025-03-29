uniform float time;
uniform float windStrength;
varying vec2 vUv;
varying float vHeight;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  
  // Original position information
  vec3 pos = position;
  vHeight = pos.y / 1.0;
  
  // Wind effect
  float heightFactor = smoothstep(0.2, 1.0, vHeight);
  
  if (heightFactor > 0.0) {
    vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float windSpeed = time * 1.5;
    float windOffset = instancePos.x * 0.1 + instancePos.z * 0.1;
    
    // Calculate wind
    float wind = sin(windSpeed + windOffset) * windStrength * heightFactor;
    wind += cos(windSpeed * 0.7 + windOffset * 1.3) * windStrength * 0.5 * heightFactor;
    
    // Movement due to wind
    pos.x += wind;
    pos.z += wind * 0.6;
  }
  
  // Apply instance matrix
  vec4 mvPosition = instanceMatrix * vec4(pos, 1.0);
    
  vPosition = pos;
  vWorldPosition = mvPosition.xyz;
  
  // Calculate final position
  gl_Position = projectionMatrix * viewMatrix * mvPosition;
}