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

// 2D grass blade SDF 함수 개선
float sdGrassBlade2d(vec2 p, float offset, float scale) {
  // 오프셋 적용
  p.x += offset;
  
  // 스케일 적용
  p *= scale;
  
  // 기본 원형 블레이드 형태
  float dist = sdCircle(p - vec2(1.7, -1.3), 2.0);
  dist = opSubtraction(dist, sdCircle(p - vec2(1.7, -1.0), 1.8));
  
  // 약간 더 뾰족한 풀잎 형태
  dist = opSubtraction(dist, p.y + 1.0);
  dist = opSubtraction(dist, -p.x + 1.7);
  
  // 변형 - 약간의 물결 패턴 추가
  float wave = sin(p.y * 8.0) * 0.03;
  dist += wave;
  
  // 스케일 보정
  return dist / scale;
}

// 여러 풀잎 SDF 중 최소값 반환 (가장 가까운 풀잎)
float multiGrassBlade(vec2 p) {
  // 풀 가닥 수 10개로 줄임
  const int bladeCount = 10;
  
  // 가로 오프셋 - 간격 넓게 조정
  float xOffsets[bladeCount] = float[](
    0.0, -0.3, 0.35, -0.5, 0.45, 
    -0.25, 0.6, -0.7, 0.55, -0.4
  );
  
  // 세로 오프셋 - 간격 넓게 조정
  float yOffsets[bladeCount] = float[](
    0.0, 0.08, -0.1, -0.15, 0.12, 
    -0.05, 0.15, -0.2, 0.18, -0.12
  );
  
  // 스케일 - 약간 더 다양하게
  float scales[bladeCount] = float[](
    1.0, 0.9, 1.1, 0.85, 1.05, 
    0.95, 1.15, 0.8, 1.0, 0.92
  );
  
  // 회전 - 조금 더 확실한 차이
  float rotations[bladeCount] = float[](
    0.0, 0.2, -0.25, 0.3, -0.15, 
    0.1, -0.3, 0.25, -0.2, 0.15
  );
  
  // 가장 가까운 거리 계산
  float minDist = 1000.0;
  
  for (int i = 0; i < bladeCount; i++) {
    vec2 offsetP = p;
    offsetP.x += xOffsets[i];
    offsetP.y += yOffsets[i];
    
    float c = cos(rotations[i]);
    float s = sin(rotations[i]);
    vec2 rotP = vec2(
      offsetP.x * c - offsetP.y * s,
      offsetP.x * s + offsetP.y * c
    );
    
    float d = sdGrassBlade2d(rotP, 0.0, scales[i]);
    minDist = min(minDist, d);
  }
  
  return minDist;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= 1.2;
  
  float d = multiGrassBlade(p * 2.0);
  
  // 훨씬 더 날카로운 엣지
  float edge = 0.005; // 매우 작은 값으로 설정
  
  // 이진 알파(binary alpha)에 가깝게 처리
  float alpha = step(0.0, -d + edge);
  
  // 확실하게 투명한 부분은 즉시 폐기
  if (alpha < 0.9) discard;
  
  // 색상 계산 부분은 그대로 유지
  vec3 topColor = grassColor * 1.3;
  vec3 bottomColor = grassColor * 0.7;
  vec3 color = mix(bottomColor, topColor, vHeight);
  
  float windFactor = sin(vWorldPosition.x * 5.0 + time * 2.0) * 0.5 + 0.5;
  float textureFactor = mix(0.85, 1.0, windFactor * vHeight);
  color *= textureFactor;
   
  // 가장자리 처리도 더 날카롭게
  alpha *= step(0.8, 1.0 - abs(p.x));
  
  gl_FragColor = vec4(color, 1.0); // 완전 불투명 처리
}