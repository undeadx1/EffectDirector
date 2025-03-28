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
  TextureLoader,
  RepeatWrapping,
  Vector2,
} from 'three';
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import { GrassShader } from '../GrassShader';

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
  /** 지형 텍스처 경로 */
  texturePath?: string;
  /** 지형 노말맵 텍스처 경로 */
  normalMapPath?: string;
  /** 텍스처 반복 횟수 */
  textureRepeat?: number;
  /** 노말맵 강도 */
  normalScale?: number;
  /** 풀 밀도 (높을수록 더 많은 풀) */
  grassDensity?: number;
  /** 풀 높이 */
  grassHeight?: number;
  /** 풀 텍스처 경로 */
  grassTexturePath?: string;
  /** 풀 색상 */
  grassColor?: string;
  /** 바람 세기 */
  windStrength?: number;
  /** 풀 활성화 여부 */
  enableGrass?: boolean;
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
export const Terrain = memo(
  forwardRef<Group, TerrainGeneratorProps>(
    (
      {
        width = 100,
        depth = 100,
        maxHeight = 15,
        widthSegments = 256,
        depthSegments = 256,
        seed = 'default-seed',
        roughness = 0.5,
        detail = 4,
        friction = 1,
        restitution = 0,
        color = '#6b8e23',
        texturePath = '/textures/grass.png',
        normalMapPath = '/textures/grass_normal.png',
        textureRepeat = 20,
        normalScale = 1.0,
        grassDensity = 0.05,
        grassHeight = 1.0,
        grassColor = '#4a7c2a',
        windStrength = 0.2,
        enableGrass = true,
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
          let amplitude = 5;

          for (let i = 0; i < 5; i++) {
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
        const geometry = new PlaneGeometry(
          width,
          depth,
          widthSegments,
          depthSegments
        );

        geometry.rotateX(-Math.PI / 2);
        const vertices = geometry.attributes.position;

        // 높이값 부드럽게 보간
        for (let i = 0; i < vertices.count; i++) {
          const x = vertices.getX(i);
          const z = vertices.getZ(i);
          const y = generateHeightmap(x + width / 2, z + depth / 2);
          vertices.setY(i, y);
        }

        // 법선 벡터 재계산
        geometry.computeVertexNormals();

        // 텍스처 로더 생성
        const textureLoader = new TextureLoader();

        // 디퓨즈 텍스처 로딩
        const texture = textureLoader.load(texturePath);
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(textureRepeat, textureRepeat);

        // 노말맵 텍스처 로딩
        const normalMap = textureLoader.load(normalMapPath);
        normalMap.wrapS = RepeatWrapping;
        normalMap.wrapT = RepeatWrapping;
        normalMap.repeat.set(textureRepeat, textureRepeat);

        // 재질 설정에 텍스처와 노말맵 추가
        const material = new MeshStandardMaterial({
          color,
          map: texture,
          normalMap: normalMap,
          normalScale: new Vector2(normalScale, normalScale),
          roughness: 0.8,
          metalness: 0.1,
          flatShading: false,
        });

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
        texturePath,
        normalMapPath,
        textureRepeat,
        normalScale,
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
            <>
              <RigidBody
                type="fixed"
                colliders="trimesh"
                friction={friction}
                restitution={restitution}
              >
                <primitive object={terrainMesh} />
              </RigidBody>

              {/* 풀 셰이더 추가 */}
              {enableGrass && (
                <GrassShader
                  terrainWidth={width}
                  terrainDepth={depth}
                  terrainHeightFunc={(x, z) => generateHeightmap(x, z)}
                  grassDensity={grassDensity}
                  grassHeight={grassHeight}
                  grassColor={grassColor}
                  windStrength={windStrength}
                />
              )}
            </>
          )}
        </group>
      );
    }
  )
);

Terrain.displayName = 'TerrainGenerator';

export default Terrain;
