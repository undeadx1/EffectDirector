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
}

export const GrassShader: React.FC<GrassShaderProps> = ({
  terrainWidth,
  terrainDepth,
  terrainHeightFunc,
  grassDensity = 0.05,
  grassHeight = 1.0,
  grassColor = '#4cff00',
  windStrength = 0.15,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const initialized = useRef(false);

  // 풀 개수 계산 - 밀도 기반
  const MAX_GRASS = 30000; // 성능을 위해 최대 개수 제한
  const count = Math.min(
    MAX_GRASS,
    Math.floor(terrainWidth * terrainDepth * grassDensity)
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 풀 지오메트리 생성
  const grassGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.2, grassHeight, 1, 4);

    // 풀잎 모양 조정 (위로 갈수록 좁아지게)
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0) {
        pos.setX(i, pos.getX(i) * (1 - y * 0.7)); // 더 뾰족하게
      }
    }

    geo.computeVertexNormals();

    // 중요: 중심을 바닥으로 변경 (바닥에 붙도록)
    geo.translate(0, grassHeight / 2, 0);

    return geo;
  }, [grassHeight]);

  // 풀 배치 (useEffect로 변경)
  useEffect(() => {
    if (!meshRef.current || initialized.current) return;

    console.log(
      `Starting grass placement: width=${terrainWidth}, depth=${terrainDepth}, count=${count}`
    );

    // 격자 크기 계산
    const gridSize = Math.ceil(Math.sqrt(count));
    const cellWidth = terrainWidth / gridSize;
    const cellDepth = terrainDepth / gridSize;

    let placedCount = 0;
    const halfWidth = terrainWidth / 2;
    const halfDepth = terrainDepth / 2;

    // 격자 기반 배치
    for (let gz = 0; gz < gridSize && placedCount < count; gz++) {
      for (let gx = 0; gx < gridSize && placedCount < count; gx++) {
        // 지형 전체에 고르게 분포하도록 위치 계산
        const baseX =
          (gx / gridSize) * terrainWidth - halfWidth + cellWidth / 2;
        const baseZ =
          (gz / gridSize) * terrainDepth - halfDepth + cellDepth / 2;

        // 각 격자 셀에 약간의 랜덤성 추가
        const randomOffset = 0.8; // 80% 정도의 랜덤 오프셋
        const offsetX = (Math.random() - 0.5) * cellWidth * randomOffset;
        const offsetZ = (Math.random() - 0.5) * cellDepth * randomOffset;

        // 최종 풀 위치
        const x = baseX + offsetX;
        const z = baseZ + offsetZ;

        // 높이 계산 (좌표계 변환)
        let y = 0;
        try {
          // 터레인 좌표계로 변환 (0~width, 0~depth)
          const sampleX = x + halfWidth;
          const sampleZ = z + halfDepth;

          // 좌표가 범위 내에 있는지 확인
          if (
            sampleX >= 0 &&
            sampleX <= terrainWidth &&
            sampleZ >= 0 &&
            sampleZ <= terrainDepth
          ) {
            y = terrainHeightFunc(sampleX, sampleZ);
          }
        } catch (error) {
          console.warn(`Height calculation failed at (${x}, ${z})`, error);
          continue; // 이 위치는 건너뛰기
        }

        // 높이값이 유효하지 않으면 건너뛰기
        if (isNaN(y) || y === undefined) {
          continue;
        }

        // 풀 특성 랜덤화
        const angle = Math.random() * Math.PI * 2;
        const scale = 0.7 + Math.random() * 0.5;
        const heightScale = scale * (0.8 + Math.random() * 0.4);

        // 인스턴스 매트릭스 설정
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(scale, heightScale, scale);
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(placedCount, dummy.matrix);
        placedCount++;

        if (placedCount % 5000 === 0) {
          console.log(`Placed ${placedCount} grass instances...`);
        }
      }
    }

    console.log(`Successfully placed ${placedCount} grass instances`);
    meshRef.current.count = placedCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
    initialized.current = true;
  }, [terrainWidth, terrainDepth, terrainHeightFunc, count]);

  // 바람 효과 셰이더 - 문제 해결: 로컬 좌표계 기준 움직임
  const vertexShader = `
    uniform float time;
    uniform float windStrength;
    varying vec2 vUv;
    varying float vHeight;
    
    void main() {
      vUv = uv;
      
      // 원본 위치 정보 저장
      vec3 pos = position;
      vHeight = pos.y / 1.0; // 높이 비율 계산 (셰이더에서 사용)
      
      // 바람 효과 - 높이에 따른 움직임 (아래쪽은 고정, 위쪽만 움직임)
      float heightFactor = smoothstep(0.2, 1.0, vHeight);
      
      if (heightFactor > 0.0) {
        // 인스턴스 위치 추출 (바람 효과에 위치 요소 반영)
        vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float windSpeed = time * 1.5;
        float windOffset = instancePos.x * 0.1 + instancePos.z * 0.1;
        
        // 바람 계산
        float wind = sin(windSpeed + windOffset) * windStrength * heightFactor;
        wind += cos(windSpeed * 0.7 + windOffset * 1.3) * windStrength * 0.5 * heightFactor;
        
        // X축 방향으로만 움직임 (지역 좌표계)
        pos.x += wind;
        // Z축 방향도 약간 움직임 (바람 방향)
        pos.z += wind * 0.6;
      }
      
      // 인스턴스 매트릭스 적용 후 변형된 위치 계산
      vec4 mvPosition = instanceMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * viewMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 grassColor;
    varying vec2 vUv;
    varying float vHeight;
    
    void main() {
      // 색상 계산
      vec3 topColor = grassColor * 1.2; // 밝은 상단
      vec3 bottomColor = grassColor * vec3(0.6, 0.7, 0.4); // 어두운 하단
      vec3 color = mix(bottomColor, topColor, vHeight);
      
      // 가장자리 처리 (가장자리는 투명하게)
      float edge = 1.0 - 2.0 * abs(vUv.x - 0.5);
      edge = pow(edge, 0.4);
      
      // 알파 처리
      float alpha = smoothstep(0.0, 0.05, edge);
      
      gl_FragColor = vec4(color, alpha);
      
      // 성능 최적화: 너무 투명한 픽셀은 폐기
      if (alpha < 0.05) discard;
    }
  `;

  const grassColorObj = useMemo(
    () => new THREE.Color(grassColor),
    [grassColor]
  );

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      grassColor: { value: grassColorObj },
      windStrength: { value: windStrength },
    }),
    [grassColorObj, windStrength]
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
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
        alphaTest={0.05}
      />
    </instancedMesh>
  );
};
