import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from './terrain/shader/windGrass.vert.glsl';
import proceduralFragmentShader from './terrain/shader/grassBlade.frag.glsl';

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
  const MAX_GRASS = 2000000;
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

    // 위치와 정보를 저장할 배열
    type GrassInstance = {
      position: THREE.Vector3;
      rotation: THREE.Euler;
      scale: THREE.Vector3;
      distanceToCamera: number;
    };

    const instances: GrassInstance[] = [];

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

          // 카메라와의 거리 계산 (간단한 Z 깊이만 고려)
          const distanceToCamera = z + halfDepth; // Z가 클수록 카메라에서 더 멀리 있음

          // 인스턴스 정보 저장
          instances.push({
            position: new THREE.Vector3(x, y, z),
            rotation: new THREE.Euler(tiltAngleX, angle, tiltAngleZ),
            scale: new THREE.Vector3(uniformScale, uniformScale, uniformScale),
            distanceToCamera,
          });

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

    // 깊이에 따라 인스턴스 정렬 (멀리 있는 것부터 가까이 있는 것 순으로)
    instances.sort((a, b) => b.distanceToCamera - a.distanceToCamera);

    // 정렬된 순서대로 매트릭스 설정
    instances.forEach((instance, i) => {
      dummy.position.copy(instance.position);
      dummy.rotation.copy(instance.rotation);
      dummy.scale.copy(instance.scale);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

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
        fragmentShader={proceduralFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={true}
        depthTest={true}
        alphaTest={0.1}
        blending={THREE.NormalBlending}
      />
    </instancedMesh>
  );
};

export default GrassShader;
