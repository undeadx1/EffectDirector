import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Vector3 } from 'three';

// 무기 타입 정의 (외부 타입 파일이 없는 경우에 대비)
type Weapon = {
  modelPath: string;
  // 다른 필요한 속성들...
};

// WeaponPreloader 유틸리티 추가
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreloadedModelMap = Map<string, any>;

// 모델 캐싱 전역 변수
const preloadedWeaponModels: PreloadedModelMap = new Map();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modelLoadingPromises: Map<string, any> = new Map();
const MAX_MODEL_CACHE_SIZE = 10; // 최대 캐시 크기
let lastCacheCleanup = Date.now();

// 무기 모델 메모리 관리
const cleanupWeaponCache = () => {
  // 10분마다 캐시 정리 (자주 사용되지 않을 때)
  const now = Date.now();
  if (now - lastCacheCleanup < 600000) return;

  lastCacheCleanup = now;

  // 현재 캐시에 너무 많은 모델이 있는 경우 가장 오래된 모델 제거
  if (preloadedWeaponModels.size > MAX_MODEL_CACHE_SIZE) {
    console.log(
      `[WeaponCache] 캐시 크기 제한 초과: ${preloadedWeaponModels.size}/${MAX_MODEL_CACHE_SIZE}`
    );
    const oldestModel = Array.from(preloadedWeaponModels.keys())[0];
    if (oldestModel) {
      const model = preloadedWeaponModels.get(oldestModel);

      // 모델 리소스 해제
      if (model && model.scene) {
        try {
          // 메시, 재질, 텍스처 등 정리
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model.scene.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.material.forEach((mat: any) => {
                  if (mat.map) mat.map.dispose();
                  mat.dispose();
                });
              } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
              }
            }
          });
        } catch (e) {
          console.error(`[WeaponCache] 모델 정리 오류:`, e);
        }
      }

      preloadedWeaponModels.delete(oldestModel);
      console.log(`[WeaponCache] 모델 캐시에서 제거: ${oldestModel}`);
    }
  }
};

// 무기 기본 컴포넌트 인터페이스
interface WeaponBaseProps {
  weapon?: Weapon;
  position?: Vector3;
  rotation?: [number, number, number];
  groupRef?: React.RefObject<Group>;
  // 다른 필요한 prop 타입들
}

export const WeaponBase: React.FC<WeaponBaseProps> = ({
  weapon,
  position,
  rotation,
  groupRef = useRef<Group>(null),
  // 다른 props
}) => {
  // 성능 관련 상태 추가
  const [isVisible, setIsVisible] = useState(true);
  const distanceCheckInterval = useRef<number>(0);
  const lastDistanceCheck = useRef<number>(Date.now());

  // GLTF 로딩 최적화
  const model = useMemo(() => {
    if (!weapon) return null;

    // 캐시에서 모델 확인
    const modelPath = weapon.modelPath;

    if (preloadedWeaponModels.has(modelPath)) {
      console.log(`[WeaponBase] 캐시된 모델 사용: ${modelPath}`);
      return preloadedWeaponModels.get(modelPath);
    }

    // 캐시에 없는 경우 로드하고 캐시에 저장
    if (!modelLoadingPromises.has(modelPath)) {
      console.log(`[WeaponBase] 새 모델 로드: ${modelPath}`);
      try {
        const loadedModel = useGLTF(modelPath);
        modelLoadingPromises.set(modelPath, loadedModel);

        // 로드된 모델을 캐시에 저장
        preloadedWeaponModels.set(modelPath, loadedModel);

        // 메모리 관리를 위한 캐시 정리
        cleanupWeaponCache();

        return loadedModel;
      } catch (error) {
        console.error(`[WeaponBase] 모델 로드 실패: ${modelPath}`, error);
        return null;
      }
    }

    return modelLoadingPromises.get(modelPath);
  }, [weapon?.modelPath]);

  // 모델 로드 에러 처리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleModelError = (error: any) => {
    console.error('[WeaponBase] 모델 로드 오류:', error);

    // 에러 발생시 로딩 상태 업데이트
    if (weapon) {
      console.log(`[WeaponBase] 모델 로드 재시도: ${weapon.modelPath}`);

      // 캐시 및 프로미스에서 실패한 모델 제거
      if (modelLoadingPromises.has(weapon.modelPath)) {
        modelLoadingPromises.delete(weapon.modelPath);
      }

      if (preloadedWeaponModels.has(weapon.modelPath)) {
        preloadedWeaponModels.delete(weapon.modelPath);
      }
    }
  };

  // 성능 최적화: 카메라와의 거리에 따라 가시성 관리
  useFrame(({ camera }) => {
    // 최적화: 10프레임마다 거리 체크 (모든 프레임에서 체크하지 않음)
    distanceCheckInterval.current++;
    if (distanceCheckInterval.current < 10) return;
    distanceCheckInterval.current = 0;

    // 거리 계산을 위한 시간 간격 확인 (100ms마다)
    const now = Date.now();
    if (now - lastDistanceCheck.current < 100) return;
    lastDistanceCheck.current = now;

    if (!groupRef.current || !weapon) return;

    // 카메라와 무기 사이의 거리 계산
    const distance = camera.position.distanceTo(groupRef.current.position);

    // 30 거리 이상이면 무기 렌더링 비활성화 (성능 최적화)
    const shouldBeVisible = distance < 30;

    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible);
    }
  });

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      // 컴포넌트 고유 리소스 정리
      if (groupRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          groupRef.current.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.material.forEach((mat: any) => {
                  if (mat.map) mat.map.dispose();
                  mat.dispose();
                });
              } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
              }
            }
          });
        } catch (e) {
          console.error('[WeaponBase] 리소스 정리 오류:', e);
        }
      }
    };
  }, []);

  // 렌더링 부분에 가시성 조건 추가
  if (!weapon || !isVisible) return null;

  // 모델 에러 처리를 위한 onError 핸들러 추가
  if (model && model.error) {
    handleModelError(model.error);
    return null;
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* 여기에 원래 렌더링 코드가 있습니다 */}
      {model && model.scene && <primitive object={model.scene.clone()} />}
    </group>
  );
};
