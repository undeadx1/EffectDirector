import { useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import {
  Group,
  Object3D,
  Mesh,
  Bone,
  SkinnedMesh,
  Vector3,
  Euler,
  AnimationMixer,
  BufferGeometry,
  BufferAttribute,
} from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ErrorBoundary } from '../../components/ErrorBoundary';

import { useModelSetup } from '../../hooks/useModelSetup';
import {
  FPS_GAME_CONSTANTS,
  FPS_GAME_EVENTS,
} from '@/game/fps/constants/game.constants';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';
import WeaponRenderer from '../../weapon/WeaponRenderer';
import { useFixedPlayerStore } from '@/game/fps/store/useFixedPlayerStore';
import { useEffectStore } from '@/game/fps/store/useEffectStore';
import { MuzzleFlashEffect } from '@/game/fps/effect/EffectComponents';
import {
  addGameEventListener,
  removeGameEventListener,
} from '@/game/fps/eventSystem/GameEvents';

interface FixedPlayerRenderProps {
  position?: Vector3;
  rotation?: Euler;
  scale?: Vector3;
  isHeadless?: boolean;
}

// 헤드 버텍스 판별 함수
const isHeadVertex = (
  vertexIndex: number,
  skinIndices: BufferAttribute,
  skinWeights: BufferAttribute,
  bones: Bone[],
  headBones: Set<Bone>
): boolean => {
  const indices = [
    skinIndices.getX(vertexIndex),
    skinIndices.getY(vertexIndex),
    skinIndices.getZ(vertexIndex),
    skinIndices.getW(vertexIndex),
  ];

  const weights = [
    skinWeights.getX(vertexIndex),
    skinWeights.getY(vertexIndex),
    skinWeights.getZ(vertexIndex),
    skinWeights.getW(vertexIndex),
  ];

  // 헤드 본의 총 영향도 계산
  const headInfluence = indices.reduce((sum, boneIdx, j) => {
    const bone = bones[boneIdx];
    return sum + (bone && headBones.has(bone) ? weights[j] : 0);
  }, 0);

  return headInfluence > 0.1; // 임계값
};

const FixedPlayerRender = (props: FixedPlayerRenderProps) => {
  const { camera } = useThree();
  const weaponRenderContainerRef = useRef<Group>(new Group());
  const mixerRef = useRef<AnimationMixer | null>(null);
  const { selectedModel, selectedWeapon } = useFpsGameStore();
  const { setWeaponRenderContainerRef } = useFixedPlayerStore();

  // 기본 반동값을 저장하는 상수 추가
  const recoilRef = useRef({
    active: false,
    startTime: 0,
    duration: 100, // 반동 애니메이션 지속 시간 (ms)
    // 기본 반동의 세기
    basePositionRecoil: new Vector3(0.01, 0.05, 0.1),
    baseRotationRecoil: new Euler(0.0, 0.0, 0.0),
    // 현재 발사에 사용될 반동 값 (랜덤 요소가 적용됨)
    positionRecoil: new Vector3(0.01, 0.01, 0.01),
    rotationRecoil: new Euler(0.01, 0.01, 0.01),
    // 원래 위치와 회전
    originalPosition: new Vector3(),
    originalRotation: new Euler(),
  });

  useEffect(() => {
    if (selectedModel) {
      useGLTF.preload(selectedModel);
    }
  }, [selectedModel]);

  // ref를 한 번만 store에 설정
  useEffect(() => {
    setWeaponRenderContainerRef(weaponRenderContainerRef);

    return () => {
      setWeaponRenderContainerRef({ current: null });
    };
  }, []); // 빈 dependency array

  const { scene: originalScene } = useGLTF(selectedModel);

  const { animations } = useModelSetup({
    modelPath: selectedModel,
    animationMap: {
      AIM: {
        animationName: 'AIM',
        loop: true,
      },
    },
  });

  const clonedScene = useMemo(() => {
    if (!originalScene) return null;
    const cloned = SkeletonUtils.clone(originalScene);
    cloned.visible = true;

    if (props.isHeadless) {
      // 헤드 본 찾기
      const headBones = new Set<Bone>();
      cloned.traverse((child) => {
        if (
          child instanceof Bone &&
          child.name.toLowerCase().includes('head')
        ) {
          headBones.add(child);
        }
      });

      // SkinnedMesh 처리
      cloned.traverse((child) => {
        if (child instanceof SkinnedMesh) {
          const originalGeometry = child.geometry;
          const newGeometry = new BufferGeometry();

          // 모든 속성 복사
          for (const key in originalGeometry.attributes) {
            const attribute = originalGeometry.attributes[key];
            newGeometry.setAttribute(key, attribute.clone());
          }

          // 인덱스 버퍼가 있다면 복사
          if (originalGeometry.index) {
            newGeometry.setIndex(originalGeometry.index.clone());
          }

          const positions = newGeometry.attributes.position;
          const skinIndices = newGeometry.attributes.skinIndex;
          const skinWeights = newGeometry.attributes.skinWeight;

          // 각 버텍스 처리
          for (let i = 0; i < positions.count; i++) {
            if (
              isHeadVertex(
                i,
                skinIndices as BufferAttribute,
                skinWeights as BufferAttribute,
                child.skeleton.bones,
                headBones
              )
            ) {
              // 헤드 버텍스를 멀리 이동
              positions.setXYZ(
                i,
                100000 + Math.random() * 1000,
                100000 + Math.random() * 1000,
                100000 + Math.random() * 1000
              );

              // 가중치를 0으로 설정
              if (skinWeights instanceof BufferAttribute) {
                skinWeights.setXYZW(i, 0, 0, 0, 0);
              }
            }
          }

          // 변경사항 적용
          positions.needsUpdate = true;
          skinWeights.needsUpdate = true;
          newGeometry.computeBoundingSphere();
          newGeometry.computeBoundingBox();

          // 새로운 geometry로 교체
          child.geometry = newGeometry;
        }
      });
    }

    // 나머지 처리
    cloned.traverse((child) => {
      if (child instanceof Object3D) {
        child.visible = true;
        child.updateMatrix();
        child.updateMatrixWorld(true);

        if (child instanceof Mesh) {
          child.material = Array.isArray(child.material)
            ? child.material.map((mat) => mat.clone())
            : child.material.clone();
        }
      }
    });

    return cloned;
  }, [originalScene, props.isHeadless]);

  useEffect(() => {
    if (!clonedScene) return;

    weaponRenderContainerRef.current.add(clonedScene);

    // 초기 위치와 회전 저장
    const initialPosition =
      props.position || FPS_GAME_CONSTANTS.WEAPON_SETTINGS.DEFAULT_POSITION;
    const initialRotation =
      props.rotation || FPS_GAME_CONSTANTS.WEAPON_SETTINGS.DEFAULT_ROTATION;

    recoilRef.current.originalPosition.copy(initialPosition);
    recoilRef.current.originalRotation.copy(initialRotation);

    weaponRenderContainerRef.current.position.copy(initialPosition);
    weaponRenderContainerRef.current.rotation.copy(initialRotation);

    if (props.scale) {
      weaponRenderContainerRef.current.scale.copy(props.scale);
    }

    camera.add(weaponRenderContainerRef.current);

    const mixer = new AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.reset().play();
    });

    return () => {
      camera.remove(weaponRenderContainerRef.current);
      weaponRenderContainerRef.current.remove(clonedScene);
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
    };
  }, [
    clonedScene,
    animations,
    camera,
    props.position,
    props.rotation,
    props.scale,
  ]);

  // 총기 반동 애니메이션 처리
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // 반동 애니메이션 처리
    if (recoilRef.current.active && weaponRenderContainerRef.current) {
      const elapsed = performance.now() - recoilRef.current.startTime;
      const progress = Math.min(elapsed / recoilRef.current.duration, 1);

      if (progress < 1) {
        // 반동 애니메이션은 빠르게 최대 반동으로 이동한 후 천천히 원래 자리로 돌아옴
        // 처음 30%는 반동 적용, 나머지 70%는 원위치로 복귀
        const recoilPhase = 0.3; // 전체 시간 중 반동 단계 비율

        if (progress < recoilPhase) {
          // 빠르게 반동 적용 (0 -> recoilPhase)
          const recoilProgress = progress / recoilPhase;
          // 비선형 애니메이션을 위한 easing 함수
          const easedProgress = 1 - Math.pow(1 - recoilProgress, 2);

          // 위치 반동 적용
          weaponRenderContainerRef.current.position.set(
            recoilRef.current.originalPosition.x +
              recoilRef.current.positionRecoil.x * easedProgress,
            recoilRef.current.originalPosition.y +
              recoilRef.current.positionRecoil.y * easedProgress,
            recoilRef.current.originalPosition.z +
              recoilRef.current.positionRecoil.z * easedProgress
          );

          // 회전 반동 적용
          weaponRenderContainerRef.current.rotation.set(
            recoilRef.current.originalRotation.x +
              recoilRef.current.rotationRecoil.x * easedProgress,
            recoilRef.current.originalRotation.y +
              recoilRef.current.rotationRecoil.y * easedProgress,
            recoilRef.current.originalRotation.z +
              recoilRef.current.rotationRecoil.z * easedProgress
          );
        } else {
          // 천천히 원래 자리로 돌아옴 (recoilPhase -> 1)
          const recoveryProgress = (progress - recoilPhase) / (1 - recoilPhase);
          // 회귀 애니메이션을 위한 easing 함수
          const easedRecovery = Math.pow(recoveryProgress, 0.5);

          // 위치 복구
          weaponRenderContainerRef.current.position.set(
            recoilRef.current.originalPosition.x +
              recoilRef.current.positionRecoil.x * (1 - easedRecovery),
            recoilRef.current.originalPosition.y +
              recoilRef.current.positionRecoil.y * (1 - easedRecovery),
            recoilRef.current.originalPosition.z +
              recoilRef.current.positionRecoil.z * (1 - easedRecovery)
          );

          // 회전 복구
          weaponRenderContainerRef.current.rotation.set(
            recoilRef.current.originalRotation.x +
              recoilRef.current.rotationRecoil.x * (1 - easedRecovery),
            recoilRef.current.originalRotation.y +
              recoilRef.current.rotationRecoil.y * (1 - easedRecovery),
            recoilRef.current.originalRotation.z +
              recoilRef.current.rotationRecoil.z * (1 - easedRecovery)
          );
        }
      } else {
        // 반동 애니메이션 완료, 정확히 원래 위치로 복귀
        weaponRenderContainerRef.current.position.copy(
          recoilRef.current.originalPosition
        );
        weaponRenderContainerRef.current.rotation.copy(
          recoilRef.current.originalRotation
        );
        recoilRef.current.active = false;
      }
    }
  });

  // 발사 핸들러 - 랜덤 반동 적용
  const handleShoot = useCallback(() => {
    //console.log('handleShoot');
    // 랜덤 반동 계산 (기본값 +/- 0.01)
    const randomRange = 0.01;
    const randomPos = new Vector3(
      recoilRef.current.basePositionRecoil.x +
        (Math.random() * 2 - 1) * randomRange,
      recoilRef.current.basePositionRecoil.y +
        (Math.random() * 2 - 1) * randomRange,
      recoilRef.current.basePositionRecoil.z +
        (Math.random() * 2 - 1) * randomRange
    );

    const randomRot = new Euler(
      recoilRef.current.baseRotationRecoil.x +
        (Math.random() * 2 - 1) * randomRange,
      recoilRef.current.baseRotationRecoil.y +
        (Math.random() * 2 - 1) * randomRange,
      recoilRef.current.baseRotationRecoil.z +
        (Math.random() * 2 - 1) * randomRange
    );

    // 계산된 랜덤 반동 적용
    recoilRef.current.positionRecoil.copy(randomPos);
    recoilRef.current.rotationRecoil.copy(randomRot);

    // 반동 애니메이션 시작
    recoilRef.current.active = true;
    recoilRef.current.startTime = performance.now();

    // 머즐 플래시 효과 추가
    if (clonedScene) {
      useEffectStore
        .getState()
        .addEffect(MuzzleFlashEffect, new Vector3(0, -0.1, 3), {
          duration: 50,
          scopeId: 'weapon',
        });
    }
  }, [clonedScene]);

  useEffect(() => {
    addGameEventListener(
      FPS_GAME_EVENTS.PLAYER_WEAPON_SHOOT_EVENT,
      handleShoot
    );
    return () => {
      removeGameEventListener(
        FPS_GAME_EVENTS.PLAYER_WEAPON_SHOOT_EVENT,
        handleShoot
      );
    };
  }, [handleShoot]);

  return (
    <primitive object={camera}>
      <group
        ref={weaponRenderContainerRef}
        position={
          props.position || FPS_GAME_CONSTANTS.WEAPON_SETTINGS.DEFAULT_POSITION
        }
        rotation={
          props.rotation || FPS_GAME_CONSTANTS.WEAPON_SETTINGS.DEFAULT_ROTATION
        }
        scale={props.scale}
      >
        {selectedWeapon && clonedScene && (
          <Suspense fallback={null}>
            <ErrorBoundary
              fallback={
                <group>
                  {/* 무기 로드 실패 시 간단한 placeholder 표시 */}
                  <mesh position={[0, 0, 8]}>
                    <boxGeometry args={[2, 0.5, 5]} />
                    <meshStandardMaterial color="gray" />
                  </mesh>
                </group>
              }
            >
              <WeaponRenderer
                scene={clonedScene as Group}
                weaponModel={selectedWeapon}
                hand="right"
                position={new Vector3(0, 0, 8)}
                rotation={new Euler(Math.PI, -Math.PI / 13, -Math.PI / 2)}
              />
            </ErrorBoundary>
          </Suspense>
        )}
      </group>
    </primitive>
  );
};

FixedPlayerRender.displayName = 'FixedWeaponRender';

export default FixedPlayerRender;
