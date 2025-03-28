import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GrassShaderProps {
  terrainWidth: number;
  terrainDepth: number;
  terrainHeightFunc: (x: number, z: number) => number;
  grassDensity?: number;
  grassHeight?: number;
  grassColor?: string;
  windStrength?: number;
  yOffset?: number;
  clusterFactor?: number;
  useProcedural?: boolean; // 프로시저럴 렌더링 사용 여부
}

export const GrassShader: React.FC<GrassShaderProps> = ({
  terrainWidth,
  terrainDepth,
  terrainHeightFunc,
  grassDensity = 0.1,
  grassHeight = 1.0,
  grassColor = '#4a7c2a',
  windStrength = 0.15,
  yOffset = 20.0,
  clusterFactor = 0.05,
  useProcedural = true, // 기본값으로 프로시저럴 방식 사용
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const initialized = useRef(false);

  // 최대 풀 개수 (성능 고려)
  const MAX_GRASS = 130000;
  const count = Math.min(
    MAX_GRASS,
    Math.floor(terrainWidth * terrainDepth * grassDensity)
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 풀 지오메트리 생성
  const grassGeometry = useMemo(() => {
    // 텍스처를 사용하므로 더 넓은 평면 사용
    const geo = new THREE.PlaneGeometry(1, grassHeight, 1, 1);

    // 중심을 바닥으로 변경
    geo.translate(0, grassHeight / 2, 0);

    return geo;
  }, [grassHeight]);

  // 뭉침 분포를 위한 노이즈 함수
  const noise2D = (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);

    const u = fx * fx * (3.0 - 2.0 * fx);
    const v = fy * fy * (3.0 - 2.0 * fy);

    return (
      (Math.sin(X * 0.1 + Y * 0.2) * 0.5 + 0.5) *
      (Math.cos(X * 0.3 + Y * 0.1) * 0.5 + 0.5)
    );
  };

  // 클러스터링 함수
  const shouldPlaceGrass = (x: number, z: number, clusterFactor: number) => {
    const n = noise2D(x * 0.05, z * 0.05);
    return n > 1.0 - clusterFactor * 0.9;
  };

  // 풀 배치
  useEffect(() => {
    if (!meshRef.current || initialized.current) return;

    console.log(
      `Starting grass placement with ${useProcedural ? 'procedural' : 'texture'} rendering`
    );

    // 격자 크기 계산
    const gridSize = Math.ceil(Math.sqrt(count * 1.5));
    const cellWidth = terrainWidth / gridSize;
    const cellDepth = terrainDepth / gridSize;

    let placedCount = 0;
    const halfWidth = terrainWidth / 2;
    const halfDepth = terrainDepth / 2;

    // 격자 기반 배치 (두 번의 패스)
    for (let pass = 0; pass < 2 && placedCount < count; pass++) {
      const currentClusterFactor =
        pass === 0 ? clusterFactor : clusterFactor * 0.3;
      const targetCount = pass === 0 ? count * 0.7 : count;

      for (let gz = 0; gz < gridSize && placedCount < targetCount; gz++) {
        for (let gx = 0; gx < gridSize && placedCount < targetCount; gx++) {
          // 위치 계산
          const baseX =
            (gx / gridSize) * terrainWidth - halfWidth + cellWidth / 2;
          const baseZ =
            (gz / gridSize) * terrainDepth - halfDepth + cellDepth / 2;

          // 랜덤 오프셋
          const randomOffset = 0.9;
          const offsetX = (Math.random() - 0.5) * cellWidth * randomOffset;
          const offsetZ = (Math.random() - 0.5) * cellDepth * randomOffset;

          // 최종 풀 위치
          const x = baseX + offsetX;
          const z = baseZ + offsetZ;

          // 클러스터링 적용
          if (pass === 0 && !shouldPlaceGrass(x, z, currentClusterFactor)) {
            continue;
          }

          if (pass === 1 && shouldPlaceGrass(x, z, clusterFactor * 0.8)) {
            if (Math.random() < 0.8) continue;
          }

          // 높이 계산
          let y = 0;
          try {
            const sampleX = x + halfWidth;
            const sampleZ = z + halfDepth;

            if (
              sampleX >= 0 &&
              sampleX <= terrainWidth &&
              sampleZ >= 0 &&
              sampleZ <= terrainDepth
            ) {
              y = terrainHeightFunc(sampleX, sampleZ);
            }
          } catch (error) {
            continue;
          }

          if (isNaN(y) || y === undefined) {
            continue;
          }

          // 풀 특성 랜덤화
          const angle = Math.random() * Math.PI * 2;

          // 스케일 제한: 0.9 - 1.1로 제한
          const uniformScale = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1 범위

          // 미세한 기울기 추가
          const tiltAngleX = (Math.random() - 0.5) * 0.1; // X축 기울기
          const tiltAngleZ = (Math.random() - 0.5) * 0.1; // Z축 기울기

          // 인스턴스 매트릭스 설정
          dummy.position.set(x, y, z);
          dummy.rotation.set(tiltAngleX, angle, tiltAngleZ);
          dummy.scale.set(uniformScale, uniformScale, 1);
          dummy.updateMatrix();

          meshRef.current.setMatrixAt(placedCount, dummy.matrix);
          placedCount++;
        }
      }
    }

    console.log(`Successfully placed ${placedCount} grass blades`);
    meshRef.current.count = placedCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
    initialized.current = true;
  }, [
    terrainWidth,
    terrainDepth,
    terrainHeightFunc,
    count,
    yOffset,
    clusterFactor,
    useProcedural,
  ]);

  // 버텍스 쉐이더 - 바람 효과 + SDF 기반 풀잎
  const vertexShader = `
    uniform float time;
    uniform float windStrength;
    uniform float yOffset;
    varying vec2 vUv;
    varying float vHeight;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      
      // 원본 위치 정보
      vec3 pos = position;
      vHeight = pos.y / 1.0;
      
      // 바람 효과
      float heightFactor = smoothstep(0.2, 1.0, vHeight);
      
      if (heightFactor > 0.0) {
        vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float windSpeed = time * 1.5;
        float windOffset = instancePos.x * 0.1 + instancePos.z * 0.1;
        
        // 바람 계산
        float wind = sin(windSpeed + windOffset) * windStrength * heightFactor;
        wind += cos(windSpeed * 0.7 + windOffset * 1.3) * windStrength * 0.5 * heightFactor;
        
        // 바람에 의한 움직임
        pos.x += wind;
        pos.z += wind * 0.6;
      }
      
      // 인스턴스 매트릭스 적용
      vec4 mvPosition = instanceMatrix * vec4(pos, 1.0);
      
      // Y 오프셋 적용
      mvPosition.y += yOffset;
      
      vPosition = pos;
      vWorldPosition = mvPosition.xyz;
      
      // 최종 위치 계산
      gl_Position = projectionMatrix * viewMatrix * mvPosition;
    }
  `;

  // 프래그먼트 쉐이더 - SDF 기반 풀잎 렌더링
  const proceduralFragmentShader = `
    uniform vec3 grassColor;
    uniform float time;
    varying vec2 vUv;
    varying float vHeight;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    // Hash 함수 - Shadertoy에서 가져옴
    vec3 hash32(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
      p3 += dot(p3, p3.yxz+33.33);
      return fract((p3.xxy+p3.yzz)*p3.zyx);
    }
    
    // SDF 유틸리티 함수
    float opSubtraction(float d1, float d2) { 
      return max(d1, -d2); 
    }
    
    float sdCircle(vec2 p, float r) {
      return length(p) - r;
    }
    
    // 2D 풀잎 SDF (Shadertoy에서 가져옴)
    float sdGrassBlade2d(vec2 p) {
      float dist = sdCircle(p - vec2(1.7, -1.3), 2.0);
      dist = opSubtraction(dist, sdCircle(p - vec2(1.7, -1.0), 1.8));
      dist = opSubtraction(dist, p.y + 1.0);
      dist = opSubtraction(dist, -p.x + 1.7);
      return dist;
    }
    
    void main() {
      // UV 공간을 [-1, 1] 범위로 변환
      vec2 p = vUv * 2.0 - 1.0;
      p.x *= 1.2; // 약간 늘림
      
      // 풀잎 부분을 SDF로 정의
      float d = sdGrassBlade2d(p * 2.0); // 스케일 조정
      
      // 거리 필드에 따라 알파 계산
      float edge = 0.05; // 에지 부드러움 정도
      float alpha = 1.0 - smoothstep(-edge, edge, d);
      
      if (alpha < 0.01) discard; // 너무 투명한 부분은 폐기
      
      // 높이에 따른 색상 변화
      vec3 topColor = grassColor * 1.1;  // 상단 색상 (약간 밝게)
      vec3 bottomColor = grassColor * 0.9;  // 하단 색상 (약간 어둡게)
      vec3 color = mix(bottomColor, topColor, vHeight);
      
      // 풀잎에 약간의 질감 추가
      float windFactor = sin(vWorldPosition.x * 5.0 + time * 2.0) * 0.5 + 0.5;
      float textureFactor = mix(0.85, 1.0, windFactor * vHeight);
      color *= textureFactor;
      
      // 가장자리 쪽이 더 투명하게
      alpha *= smoothstep(1.0, 0.7, abs(p.x));
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // 일반 텍스처 기반 프래그먼트 쉐이더
  const textureFragmentShader = `
    uniform sampler2D grassTexture;
    uniform vec3 grassColor;
    uniform bool textureTint;
    varying vec2 vUv;
    varying float vHeight;
    
    void main() {
      // 텍스처 샘플링
      vec4 texColor = vec4(1.0); // 텍스처가 없는 경우를 위한 기본값
      
      // 텍스처가 있으면 사용
      #ifdef HAS_TEXTURE
      texColor = texture2D(grassTexture, vUv);
      #else
      // 텍스처 없으면 프로시저럴 마스크 생성
      vec2 p = vUv * 2.0 - 1.0;
      float d = 1.0 - length(p);
      texColor.a = smoothstep(0.0, 0.1, d);
      #endif
      
      // 색상 계산
      vec3 color;
      if (textureTint) {
        // 기본 색상에 텍스처를 적용하여 tint 효과
        vec3 topColor = grassColor * 1.1;
        vec3 bottomColor = grassColor * 0.9;
        vec3 tintColor = mix(bottomColor, topColor, vHeight);
        
        // 텍스처와 tint 색상 혼합
        color = texColor.rgb * tintColor;
      } else {
        // 풀의 경우 단순히 초록색 적용
        vec3 topColor = grassColor * 1.1;
        vec3 bottomColor = grassColor * 0.9;
        color = mix(bottomColor, topColor, vHeight);
      }
      
      // 알파값 처리
      float alpha = texColor.a;
      
      // 너무 투명한 픽셀은 폐기
      if (alpha < 0.1) discard;
      
      // 최종 색상
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const grassColorObj = useMemo(
    () => new THREE.Color(grassColor),
    [grassColor]
  );

  // 유니폼 설정
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      grassColor: { value: grassColorObj },
      windStrength: { value: windStrength },
      yOffset: { value: yOffset },
    }),
    [grassColorObj, windStrength, yOffset]
  );

  // 애니메이션
  useFrame((state) => {
    time.current = state.clock.elapsedTime;
    if (meshRef.current && meshRef.current.material) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.time.value =
        time.current;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[grassGeometry, undefined, count]}
      frustumCulled={true}
      renderOrder={2}
    >
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={
          useProcedural ? proceduralFragmentShader : textureFragmentShader
        }
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
        alphaTest={0.05}
      />
    </instancedMesh>
  );
};

export default GrassShader;
