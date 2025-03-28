import React, { useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  NormalBlending,
  Color,
  Euler,
  Vector3,
  Quaternion,
  DoubleSide,
  TextureLoader,
  Object3D,
  RepeatWrapping,
} from 'three';
import * as THREE from 'three';
import { SpriteSheetEffect } from '@/game/fps/effect/SpriteSheetEffect';
import { useFrame } from '@react-three/fiber';
import { calculateSurfaceRotation } from './EffectUtils';

export const MuzzleFlashEffect: React.FC<{ position: Vector3 }> = ({
  position,
}) => {
  // Generate a random Z-axis rotation between 0 and 2π
  const randomRotation = useMemo(() => {
    return new Euler(0, 0, Math.random() * Math.PI * 2);
  }, []);

  return (
    <SpriteSheetEffect
      position={position}
      rotation={randomRotation}
      texturePath="/textures/effects/muzzle.png"
      framesPerRow={1}
      framesPerColumn={1}
      duration={100}
      scale={1}
      color={new Color(1, 1, 1)}
      blending={AdditiveBlending}
      fadeOut
      scaleAnimation={{ start: 2, mid: 0.75, end: 0 }}
      opacityAnimation={{ start: 1, mid: 1, end: 1 }}
    />
  );
};

export const BulletHole: React.FC<{
  position: Vector3;
  normal?: Vector3;
}> = ({ position, normal }) => {
  // 랜덤 회전 생성 (z축)
  const randomRotation = useMemo(() => {
    return new Euler(0, 0, Math.random() * Math.PI * 2);
  }, []);

  // normal 벡터를 기반으로 회전 계산
  const surfaceRotation = useMemo(() => {
    return calculateSurfaceRotation(position, normal, randomRotation);
  }, [normal, randomRotation, position]);

  // z-fighting 방지용 position 조정
  const adjustedPosition = useMemo(() => {
    if (normal) {
      // normal 방향으로 약간 이동 (0.01 단위)
      return new Vector3().copy(position).addScaledVector(normal, 0.01);
    }
    return new Vector3().copy(position).add(new Vector3(0, 0, 0.01));
  }, [position, normal]);

  return (
    <SpriteSheetEffect
      position={adjustedPosition}
      rotation={surfaceRotation}
      texturePath="/textures/effects/bullethole.png"
      framesPerRow={1}
      framesPerColumn={1}
      duration={5000}
      scale={0.1}
      color={new Color(0.5, 0.5, 0.5)}
      blending={NormalBlending}
      depthWrite={false}
      polygonOffset={true}
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
      fadeOut
      disableBillboard={true}
      opacityAnimation={{ start: 1, mid: 1, end: 0 }}
    />
  );
};

// 텍스처 기반 레이저 빔 컴포넌트 (단순화 버전)
export const TexturedLaserBeam: React.FC<{
  position: Vector3;
  hitObject?: Object3D;
}> = ({ position, hitObject }) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // hitObject에서 레이저 속성 추출
  const laserProps = hitObject as unknown as {
    end?: Vector3;
    width?: number;
    texturePath?: string;
    color?: string;
    flowSpeed?: number;
  };

  // 속성 추출 및 기본값 설정
  const targetEnd =
    laserProps?.end || new Vector3(position.x, position.y, position.z + 10);
  const width = laserProps?.width || 0.02;
  const texturePath =
    laserProps?.texturePath || '/textures/effects/shootlaser.png';
  const color = laserProps?.color || '#ffffff';

  // 시작점에서 끝점까지의 거리와 방향 계산
  const direction = targetEnd.clone().sub(position);
  const distance = direction.length();

  // 실린더의 중심점 (시작점과 끝점의 중간)
  const center = position.clone().add(targetEnd).multiplyScalar(0.5);

  // 방향 벡터 정규화
  const normalizedDirection = direction.clone().normalize();

  // 실린더의 방향을 설정하기 위한 쿼터니언
  const beamQuaternion = useMemo(() => {
    // 기본 실린더는 Y축 방향으로 생성되므로, Y축에서 방향 벡터로의 회전 필요
    const cylinderDirection = new Vector3(0, 1, 0);
    return new Quaternion().setFromUnitVectors(
      cylinderDirection,
      normalizedDirection
    );
  }, [normalizedDirection]);

  // 끝 부분이 페이드 아웃 되는 그라데이션 텍스처 생성
  const gradientTexture = useMemo(() => {
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 가로 방향 그라데이션 생성 (중앙에서 가장자리로)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    // 왼쪽 가장자리 (투명)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    // 왼쪽 중간
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    // 중앙 (완전 불투명)
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
    // 오른쪽 중간
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    // 오른쪽 가장자리 (투명)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    // 그라데이션 적용
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 텍스처 생성
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    return texture;
  }, []);

  // 원본 텍스처 로드
  const originalTexture = useMemo(() => {
    const texture = new TextureLoader().load(texturePath);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1, Math.ceil(distance / 2));
    return texture;
  }, [texturePath, distance]);

  // 플로우 효과를 위한 타임 오프셋 계산 (선택 사항)
  const [offset, setOffset] = useState(0);
  const flowSpeed = laserProps?.flowSpeed || 0.5;

  useFrame((_, delta) => {
    // 시간에 따라 텍스처 오프셋 업데이트
    setOffset((prev) => (prev + delta * flowSpeed) % 1);

    if (originalTexture) {
      originalTexture.offset.y = offset;
    }
  });

  return (
    <group position={center} quaternion={beamQuaternion}>
      {/* 실린더 대신 빌보드 형태의 두 개의 직교하는 평면 사용 */}
      {/* 첫 번째 평면 */}
      <mesh>
        <planeGeometry args={[width * 2, distance]} />
        <meshBasicMaterial
          ref={materialRef}
          map={originalTexture}
          transparent={true}
          depthWrite={false}
          blending={NormalBlending}
          color={color}
          side={DoubleSide}
          alphaMap={gradientTexture}
        />
      </mesh>
      {/* 두 번째 평면 (90도 회전) */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[width * 2, distance]} />
        <meshBasicMaterial
          map={originalTexture}
          transparent={true}
          depthWrite={false}
          blending={NormalBlending}
          color={color}
          side={DoubleSide}
          alphaMap={gradientTexture}
        />
      </mesh>
    </group>
  );
};

export const SparkEffect: React.FC<{ position: Vector3 }> = ({ position }) => {
  // Generate a random Z-axis rotation between 0 and 2π
  const randomRotation = useMemo(() => {
    return new Euler(0, 0, Math.random() * Math.PI * 2);
  }, []);

  return (
    <SpriteSheetEffect
      position={position}
      rotation={randomRotation}
      texturePath="/textures/effects/spark.png"
      framesPerColumn={1}
      framesPerRow={1}
      duration={200}
      scale={1}
      color={new Color(1, 1, 1)}
      fadeOut
      depthTest={false}
      polygonOffset={true}
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
      blending={AdditiveBlending}
      scaleAnimation={{ start: 1, mid: 0, end: 0 }}
      opacityAnimation={{ start: 1, mid: 0, end: 0 }}
    />
  );
};
