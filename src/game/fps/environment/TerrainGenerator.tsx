// src/game/fps/environment/TerrainGenerator.tsx
import { forwardRef, memo, useMemo, useEffect, useState } from 'react';
import { RigidBody } from '@react-three/rapier';
import {
  Box3,
  Vector3,
  Group,
  PlaneGeometry,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';

/** TerrainGenerator 컴포넌트의 Props */
interface TerrainGeneratorProps {
  /** 지형 크기 (가로) */
  width?: number;
  /** 지형 크기 (세로) */
  depth?: number;
  /** 지형의 최대 높이 */
  maxHeight?: number;
  /** 지형 해상도 (가로) */
  widthSegments?: number;
  /** 지형 해상도 (세로) */
  depthSegments?: number;
  /** 지형 생성에 사용할 시드 값 */
  seed?: string;
  /** 지형의 거칠기 (높을수록 더 거친 지형) */
  roughness?: number;
  /** 지형의 세부 사항 수준 (높을수록 더 세부적인 지형) */
  detail?: number;
  /** 지형의 물리적 마찰력 */
  friction?: number;
  /** 지형의 반발력 */
  restitution?: number;
  /** 지형 재질 색상 */
  color?: string;
}

/**
 * 높이맵 기반 자연 지형 생성 컴포넌트
 *
 * 특징:
 * - Simplex 노이즈를 사용한 자연스러운 지형 생성
 * - 시드 값 기반의 재현 가능한 랜덤 지형
 * - 물리 충돌 영역 자동 생성
 * - 다양한 커스터마이징 옵션
 *
 * @component
 * @example
 * ```tsx
 * <TerrainGenerator
 *   width={100}
 *   depth={100}
 *   maxHeight={15}
 *   seed="my-terrain-123"
 *   roughness={0.8}
 *   detail={5}
 * />
 * ```
 */
export const TerrainGenerator = memo(
  forwardRef<Group, TerrainGeneratorProps>(
    (
      {
        width = 100,
        depth = 100,
        maxHeight = 15,
        widthSegments = 64,
        depthSegments = 64,
        seed = 'default-seed',
        roughness = 0.5,
        detail = 4,
        friction = 1,
        restitution = 0,
        color = '#6b8e23',
      },
      ref
    ) => {
      // 지형 메시 참조
      const [terrainMesh, setTerrainMesh] = useState<Mesh | null>(null);

      // 시드 기반 노이즈 생성기 초기화
      const noiseGenerator = useMemo(() => {
        // seedrandom으로 랜덤 함수 생성
        const rng = seedrandom(seed);
        return createNoise2D(() => rng());
      }, [seed]);

      // 높이맵 생성 함수
      const generateHeightmap = useMemo(() => {
        return (x: number, z: number) => {
          const normX = x / width;
          const normZ = z / depth;

          // 1. 대규모 지형 생성 (언덕과 계곡)
          let baseHeight = 0;
          let frequency = 0.2; // 더 낮은 주파수로 시작 (더 넓은 언덕/계곡)
          let amplitude = 1;

          for (let i = 0; i < 2; i++) {
            // 더 적은 옥타브 (대형 지형에만 집중)
            baseHeight +=
              noiseGenerator(normX * frequency, normZ * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
          }

          // 2. 세부 디테일 생성 (울퉁불퉁함)
          let detailHeight = 0;
          frequency = 1;
          amplitude = 0.1; // 디테일의 영향 감소

          for (let i = 0; i < detail; i++) {
            detailHeight +=
              noiseGenerator(normX * frequency, normZ * frequency) * amplitude;
            amplitude *= roughness;
            frequency *= 2;
          }

          // 3. 평지 생성 - 지수 함수로 높이 분포 조정
          baseHeight =
            Math.pow(Math.abs(baseHeight), 1.5) * Math.sign(baseHeight);

          // 4. 평지화 적용 - 낮은 값은 평평하게, 높은 값은 언덕으로
          const flatness = 0.3; // 평지화 강도 (높을수록 더 많은 평지)
          if (baseHeight < flatness) {
            baseHeight *= 0.3; // 낮은 지역은 더 평평하게
          }

          // 최종 높이 = 기본 지형 + 디테일 (디테일은 언덕에서만 더 강하게)
          const combinedHeight =
            baseHeight + detailHeight * (baseHeight * 0.5 + 0.5);

          // 최종 스케일링
          return (maxHeight * (combinedHeight + 1)) / 2;
        };
      }, [noiseGenerator, width, depth, maxHeight, roughness, detail]);

      // 지형 메시 생성
      const terrain = useMemo(() => {
        // 평면 지오메트리 생성
        const geometry = new PlaneGeometry(
          width,
          depth,
          widthSegments,
          depthSegments
        );

        // 지오메트리를 x-z 평면으로 회전 (기본 평면은 x-y 평면)
        geometry.rotateX(-Math.PI / 2);

        // 버텍스 좌표 가져오기
        const vertices = geometry.attributes.position;

        // 각 버텍스의 높이(y값) 조정
        for (let i = 0; i < vertices.count; i++) {
          // 현재 버텍스의 x, z 좌표
          const x = vertices.getX(i);
          const z = vertices.getZ(i);

          // 높이맵에서 해당 좌표의 높이값 계산
          const y = generateHeightmap(
            x + width / 2, // 좌표 오프셋 (중앙이 0,0이 되도록)
            z + depth / 2
          );

          // 계산된 높이값으로 y좌표 설정
          vertices.setY(i, y);
        }

        // 법선 벡터 재계산 (조명 계산을 위해 필요)
        geometry.computeVertexNormals();

        // 지형 재질 생성
        const material = new MeshStandardMaterial({
          color,
          roughness: 0.8,
          metalness: 0.1,
          flatShading: false,
        });

        // 지형 메시 생성
        const mesh = new Mesh(geometry, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        return mesh;
      }, [
        width,
        depth,
        widthSegments,
        depthSegments,
        color,
        generateHeightmap,
      ]);

      // 지형 메시 설정
      useEffect(() => {
        setTerrainMesh(terrain);
      }, [terrain]);

      // 지형 중심 계산 (물리 엔진용)
      const adjustedPosition = useMemo(() => {
        if (terrainMesh) {
          const boundingBox = new Box3().setFromObject(terrainMesh);
          const center = new Vector3();
          boundingBox.getCenter(center);

          return new Vector3(-center.x, -center.y, -center.z);
        }
        return new Vector3(0, 0, 0);
      }, [terrainMesh]);

      return (
        <group position={adjustedPosition} ref={ref}>
          {terrainMesh && (
            <RigidBody
              type="fixed"
              colliders="trimesh"
              friction={friction}
              restitution={restitution}
            >
              <primitive object={terrainMesh} />
            </RigidBody>
          )}
        </group>
      );
    }
  )
);

TerrainGenerator.displayName = 'TerrainGenerator';

export default TerrainGenerator;
