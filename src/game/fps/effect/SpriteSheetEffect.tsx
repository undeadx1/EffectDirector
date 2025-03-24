import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  NearestFilter,
  Vector3,
  MeshBasicMaterial,
  Mesh,
  Blending,
  Euler,
  Quaternion,
} from 'three';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// 글로벌 텍스처 캐시 시스템
interface TextureCacheEntry {
  texture: THREE.Texture;
  refCount: number;
  lastUsed: number;
}

const textureCache = new Map<string, TextureCacheEntry>();

// 30초마다 사용되지 않는 텍스처 정리
const TEXTURE_CLEANUP_INTERVAL = 30000;
const TEXTURE_IDLE_TIMEOUT = 10000; // 10초 동안 사용되지 않은 텍스처 해제

setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  textureCache.forEach((entry, key) => {
    // 참조 카운트가 0이고 일정 시간 사용되지 않은 텍스처 정리
    if (entry.refCount <= 0 && now - entry.lastUsed > TEXTURE_IDLE_TIMEOUT) {
      entry.texture.dispose();
      textureCache.delete(key);
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`[TextureCache] 미사용 텍스처 ${cleanedCount}개 정리됨`);
  }
}, TEXTURE_CLEANUP_INTERVAL);

// 애니메이션 키프레임을 위한 인터페이스 추가
interface AnimationKeyframes {
  start: number;
  mid: number;
  end: number;
}

interface SpriteSheetEffectProps {
  position: Vector3;
  texturePath: string;
  framesPerRow: number;
  framesPerColumn: number;
  duration?: number; // Total duration of the animation in milliseconds
  scale?: number;
  color?: Color;
  opacity?: number;
  loop?: boolean;
  blending?: number;
  depthWrite?: boolean;
  depthTest?: boolean;
  polygonOffset?: boolean;
  polygonOffsetFactor?: number;
  polygonOffsetUnits?: number;
  fadeOut?: boolean;
  autoPlay?: boolean;
  rotation?: Euler;
  onComplete?: () => void;
  // 새로운 애니메이션 속성 추가
  scaleAnimation?: AnimationKeyframes;
  opacityAnimation?: AnimationKeyframes;
  // 빌보드 효과를 비활성화하는 옵션 추가
  disableBillboard?: boolean;
  // 표면 법선 벡터 (벽에 붙이는 효과 등에 사용)
  normal?: Vector3;
}

export const SpriteSheetEffect: React.FC<SpriteSheetEffectProps> = ({
  position,
  texturePath,
  framesPerRow,
  framesPerColumn,
  duration = 500, // Default 500ms
  scale = 1,
  color = new Color(1, 1, 1),
  opacity = 1,
  loop = false,
  blending = AdditiveBlending,
  depthWrite = false,
  depthTest = true,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  polygonOffsetUnits = 0,
  fadeOut = false,
  autoPlay = true,
  onComplete,
  rotation,
  scaleAnimation,
  opacityAnimation,
  disableBillboard = false,
  normal,
}) => {
  const { camera } = useThree();
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);

  // 재사용 가능한 객체 생성 (매 프레임 새로 만들지 않음)
  const cameraQuaternionRef = useRef(new Quaternion());
  const finalQuaternionRef = useRef(new Quaternion());

  // Texture and animation state
  const texture = useTexture(texturePath);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;

  // Animation state
  const totalFrames = framesPerRow * framesPerColumn;
  const frameWidth = 1 / framesPerRow;
  const frameHeight = 1 / framesPerColumn;

  // Animation tracking
  const animationStateRef = useRef({
    currentFrame: 0,
    elapsedTime: 0,
    finished: false,
    progress: 0, // 애니메이션 진행 상태를 추적하기 위한 값 추가
  });

  // Fade out animation
  const { opacity: fadeOpacity } = useSpring({
    opacity: fadeOut && animationStateRef.current.finished ? 0 : opacity,
    config: { duration: 200 },
  });

  // 법선 벡터에 따른 회전을 위한 quaternion 저장
  const normalRotationRef = useRef<Quaternion | null>(null);

  // 텍스처 캐싱 및 참조 카운팅 추가
  useEffect(() => {
    // 캐시에 텍스처 등록
    let cacheEntry = textureCache.get(texturePath);

    if (!cacheEntry) {
      cacheEntry = {
        texture: texture,
        refCount: 0,
        lastUsed: Date.now(),
      };
      textureCache.set(texturePath, cacheEntry);
    }

    cacheEntry.refCount++;
    cacheEntry.lastUsed = Date.now();

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 참조 카운트 감소
      const entry = textureCache.get(texturePath);
      if (entry) {
        entry.refCount--;
        entry.lastUsed = Date.now();
      }

      // 메시와 머티리얼 정리
      if (meshRef.current && meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }

      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, [texturePath, texture]);

  // 법선 벡터가 제공되면 해당 방향으로 향하는 회전 계산
  useEffect(() => {
    if (normal && disableBillboard) {
      const upVector = new Vector3(0, 1, 0);
      const quaternion = new Quaternion();

      // 법선 방향으로 향하는 회전 계산
      quaternion.setFromUnitVectors(upVector, normal.clone().normalize());

      normalRotationRef.current = quaternion;

      // 초기 회전 적용
      if (meshRef.current) {
        meshRef.current.quaternion.copy(quaternion);
      }
    }
  }, [normal, disableBillboard]);

  // Update sprite sheet frame and handle billboard effect
  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // 캐시 엔트리 사용 시간 업데이트
    const cacheEntry = textureCache.get(texturePath);
    if (cacheEntry) {
      cacheEntry.lastUsed = Date.now();
    }

    // 빌보드 효과 (disableBillboard가 false일 때만 적용)
    if (!disableBillboard) {
      // 재사용 가능한 Quaternion 객체 사용
      cameraQuaternionRef.current.copy(camera.quaternion);
      const zRotation = meshRef.current.rotation.z;

      finalQuaternionRef.current.setFromEuler(new Euler(0, 0, zRotation));
      cameraQuaternionRef.current.multiply(finalQuaternionRef.current);

      meshRef.current.quaternion.copy(cameraQuaternionRef.current);

      // Apply custom rotation if provided
      if (rotation) {
        meshRef.current.rotation.z = rotation.z;
      }
    } else {
      // 빌보드 비활성화 시 처리
      if (normal && normalRotationRef.current) {
        // 법선 방향에 따른 고정 회전 적용
        meshRef.current.quaternion.copy(normalRotationRef.current);
      } else if (rotation) {
        // 또는 제공된 회전값 적용
        meshRef.current.setRotationFromEuler(rotation);
      }
    }

    // Rest of the animation logic
    if (!autoPlay || animationStateRef.current.finished) return;

    animationStateRef.current.elapsedTime += delta * 1000;

    // Calculate current frame
    const frameTime = duration / totalFrames;
    const currentFrameIndex = Math.floor(
      animationStateRef.current.elapsedTime / frameTime
    );

    // Calculate overall progress (0 to 1)
    animationStateRef.current.progress = Math.min(
      animationStateRef.current.elapsedTime / duration,
      1
    );

    // Apply scale animation if provided
    if (scaleAnimation && meshRef.current) {
      const { start, mid, end } = scaleAnimation;
      const progress = animationStateRef.current.progress;

      // First half: start -> mid
      // Second half: mid -> end
      let currentScale;
      if (progress <= 0.5) {
        // 0-0.5 범위를 0-1로 변환
        const normalizedProgress = progress * 2;
        currentScale = start + (mid - start) * normalizedProgress;
      } else {
        // 0.5-1 범위를 0-1로 변환
        const normalizedProgress = (progress - 0.5) * 2;
        currentScale = mid + (end - mid) * normalizedProgress;
      }

      meshRef.current.scale.set(currentScale, currentScale, currentScale);
    } else if (meshRef.current) {
      // 기본 스케일 적용
      meshRef.current.scale.set(scale, scale, scale);
    }

    // Apply opacity animation if provided
    if (opacityAnimation && materialRef.current) {
      const { start, mid, end } = opacityAnimation;
      const progress = animationStateRef.current.progress;

      let currentOpacity;
      if (progress <= 0.5) {
        const normalizedProgress = progress * 2;
        currentOpacity = start + (mid - start) * normalizedProgress;
      } else {
        const normalizedProgress = (progress - 0.5) * 2;
        currentOpacity = mid + (end - mid) * normalizedProgress;
      }

      materialRef.current.opacity = currentOpacity;
    }

    // Update texture offset
    if (currentFrameIndex < totalFrames) {
      const row = Math.floor(currentFrameIndex / framesPerRow);
      const col = currentFrameIndex % framesPerRow;

      texture.offset.set(col * frameWidth, 1 - (row + 1) * frameHeight);
    } else {
      // Animation completed
      animationStateRef.current.finished = true;

      if (!loop) {
        onComplete?.();
      } else {
        // Reset for looping
        animationStateRef.current.elapsedTime = 0;
        animationStateRef.current.finished = false;
        animationStateRef.current.progress = 0;
      }
    }
  });

  // Initial texture setup
  useEffect(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = 1000; // RepeatWrapping
      texture.repeat.set(frameWidth, frameHeight);
      texture.offset.set(0, 1 - frameHeight);
    }
  }, [texture, framesPerRow, framesPerColumn, frameWidth, frameHeight]);

  return (
    <animated.mesh ref={meshRef} position={position}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={fadeOut && !opacityAnimation ? fadeOpacity.get() : opacity}
        color={color}
        blending={(blending as Blending) ?? AdditiveBlending}
        depthWrite={depthWrite}
        depthTest={depthTest}
        polygonOffset={polygonOffset}
        polygonOffsetFactor={polygonOffsetFactor}
        polygonOffsetUnits={polygonOffsetUnits}
        side={DoubleSide}
      />
    </animated.mesh>
  );
};

export default SpriteSheetEffect;
