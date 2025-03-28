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
  noiseScale?: number; // 노이즈 스케일 조절 (클러스터 크기 조절)
  clusterThreshold?: number; // 클러스터링 임계값
}

export const GrassShader: React.FC<GrassShaderProps> = ({
  terrainWidth,
  terrainDepth,
  terrainHeightFunc,
  grassDensity = 0.1,
  grassHeight = 1.0,
  grassColor = '#ffffff',
  windStrength = 0.15,
  yOffset = 20.0,
  clusterFactor = 0.7, // 기본값 증가 (0.05 → 0.7)
  useProcedural = true,
  noiseScale = 0.15,
  clusterThreshold = 0.5,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const initialized = useRef(false);

  // 최대 풀 개수 (성능 고려)
  const MAX_GRASS = 260000;
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

  // 향상된 노이즈 함수 (더 자연스러운 분포)
  const noise2D = (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // 더 복잡한 노이즈 패턴 (여러 주파수)
    const n1 =
      (Math.sin(X * 0.1 + Y * 0.2) * 0.5 + 0.5) *
      (Math.cos(X * 0.3 + Y * 0.1) * 0.5 + 0.5);
    const n2 =
      (Math.sin(X * 0.5 + Y * 0.3) * 0.5 + 0.5) *
      (Math.cos(X * 0.2 + Y * 0.6) * 0.5 + 0.5);

    // 노이즈 혼합
    return n1 * 0.7 + n2 * 0.3;
  };

  // 개선된 클러스터링 함수
  const shouldPlaceGrass = (x: number, z: number, clusterFactor: number) => {
    // 노이즈 스케일 적용 (noiseScale이 클수록 클러스터가 작고 많아짐)
    const n = noise2D(x * noiseScale, z * noiseScale);

    // 임계값 로직 개선
    // clusterFactor가 클수록 더 많은 풀이 생성됨
    // clusterThreshold는 기본 임계값 (낮을수록 더 많은 풀 생성)
    return n > clusterThreshold - clusterFactor * 0.5;
  };

  // 풀 배치 로직
  useEffect(() => {
    if (!meshRef.current || initialized.current) return;

    console.log(
      `Starting grass placement with clustering factor ${clusterFactor} and noise scale ${noiseScale}`
    );

    // 격자 크기 계산 - 밀도에 따라 조정
    const densityFactor = Math.min(3, Math.max(1, grassDensity * 10)); // 밀도가 높을수록 더 세밀한 격자
    const gridSize = Math.ceil(Math.sqrt(count * densityFactor));
    const cellWidth = terrainWidth / gridSize;
    const cellDepth = terrainDepth / gridSize;

    let placedCount = 0;
    const halfWidth = terrainWidth / 2;
    const halfDepth = terrainDepth / 2;

    // 클러스터링 정보 추적
    let clusterCount = 0;
    let nonClusterCount = 0;

    // 높은 밀도일 경우 최적화된 간격으로 배치
    const highDensity = grassDensity > 0.1;
    const skipFactor = highDensity ? 2 : 1; // 높은 밀도에서는 일부만 처리

    // 격자 기반 배치 (두 번의 패스)
    for (let pass = 0; pass < 2 && placedCount < count; pass++) {
      // 첫 번째 패스: 주요 클러스터링 (더 많은 풀)
      // 두 번째 패스: 빈 공간 채우기 (적은 수의 풀)
      const currentClusterFactor =
        pass === 0 ? clusterFactor : clusterFactor * 0.3;

      // 높은 밀도에서는 첫번째 패스에 더 많은 풀을 배치
      const targetCount =
        pass === 0 ? count * (highDensity ? 0.9 : 0.8) : count;

      for (
        let gz = 0;
        gz < gridSize && placedCount < targetCount;
        gz += skipFactor
      ) {
        for (
          let gx = 0;
          gx < gridSize && placedCount < targetCount;
          gx += skipFactor
        ) {
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

          // 개선된 클러스터링 적용
          const isInCluster = shouldPlaceGrass(x, z, currentClusterFactor);

          if (pass === 0) {
            // 첫 번째 패스: 클러스터에만 배치
            if (!isInCluster) continue;
            clusterCount++;
          } else {
            // 두 번째 패스: 클러스터가 아닌 곳에만 드문드문 배치
            if (isInCluster) {
              // 이미 클러스터인 곳은 높은 확률로 건너뜀
              if (Math.random() < 0.9) continue;
            } else {
              // 클러스터가 아닌 곳에도 낮은 확률로 배치
              if (Math.random() < 0.7) continue;
            }
            nonClusterCount++;
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
          } catch {
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
          dummy.scale.set(uniformScale, uniformScale, uniformScale);
          dummy.updateMatrix();

          meshRef.current.setMatrixAt(placedCount, dummy.matrix);
          placedCount++;

          // 진행 상황 로깅
          if (placedCount % 10000 === 0) {
            console.log(`Placed ${placedCount}/${count} grass instances...`);
          }
        }
      }

      // 패스 완료 로깅
      console.log(
        `Pass ${pass + 1} complete: ${pass === 0 ? clusterCount : nonClusterCount} instances placed`
      );
    }

    console.log(`Successfully placed ${placedCount} grass blades`);
    console.log(
      `Clustering statistics: ${clusterCount} in clusters, ${nonClusterCount} scattered`
    );

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
    noiseScale,
    clusterThreshold,
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
      
      // 거리 필드에 따라 알파 계산 - 더 넓은 범위의 알파값 허용
      float edge = 0.1; // 에지 부드러움 정도 (0.05→0.1로 증가)
      float alpha = 1.0 - smoothstep(-edge, edge, d);
      
      // 더 투명한 부분도 일부 허용 (0.01→0.005로 감소)
      if (alpha < 0.005) discard; 
      
      // 높이에 따른 색상 변화
      vec3 topColor = grassColor * 1.2;  // 상단 색상 (더 밝게)
      vec3 bottomColor = grassColor * 0.8;  // 하단 색상 (더 어둡게)
      vec3 color = mix(bottomColor, topColor, vHeight);
      
      // 풀잎에 약간의 질감 추가
      float windFactor = sin(vWorldPosition.x * 5.0 + time * 2.0) * 0.5 + 0.5;
      float textureFactor = mix(0.85, 1.0, windFactor * vHeight);
      color *= textureFactor;
      
      // 가장자리 처리 개선 - 모든 시점에서 더 잘 보이도록
      alpha *= smoothstep(1.0, 0.5, abs(p.x));
      
      // 알파값 강화
      alpha = pow(alpha, 0.8); // 알파값을 전체적으로 증가시킴
      
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
      frustumCulled={false}
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
        depthWrite={true}
        alphaTest={0.01}
      />
    </instancedMesh>
  );
};

export default GrassShader;
