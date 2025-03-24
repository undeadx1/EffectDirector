import { useEffect, useRef, useMemo, forwardRef } from 'react';
import {
  Group,
  Vector3,
  Box3,
  Euler,
  Mesh,
  Material,
  MeshStandardMaterial,
} from 'three';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useHandBones } from '../hooks/useHandBones';
import { FPS_GAME_CONSTANTS } from '../constants/game.constants';
import {
  getCachedWeaponModel,
  isWeaponModelsPreloaded,
} from '../preload/WeaponPreloader';

interface WeaponModelProps {
  scene: Group;
  weaponModel: string;
  hand?: 'left' | 'right';
  position: Vector3;
  rotation: Euler;
}

const WeaponRenderer = forwardRef<Group | null, WeaponModelProps>(
  ({ scene, weaponModel, hand = 'right', position, rotation }, ref) => {
    const { leftHand, rightHand } = useHandBones(scene);
    const mountedRef = useRef(false);

    // 무기 모델 로드 - 사전 로딩된 모델을 우선 사용
    const weaponGltf = useMemo(() => {
      try {
        // 사전 로딩된 모델이 있으면 사용
        if (isWeaponModelsPreloaded()) {
          const cachedModel = getCachedWeaponModel(weaponModel);
          if (cachedModel) {
            console.log(`[WeaponBase] 캐시된 모델 사용: ${weaponModel}`);
            return cachedModel;
          }
        }

        // 캐시된 모델이 없으면 직접 로드
        console.log(`[WeaponBase] 직접 모델 로드: ${weaponModel}`);
        return useGLTF(weaponModel);
      } catch (error) {
        console.error(
          `[WeaponBase] 무기 모델 로드 오류: ${weaponModel}`,
          error
        );
        // 오류 발생 시 기본 값 반환
        return useGLTF(weaponModel);
      }
    }, [weaponModel]);

    // 재질을 깊은 복사하는 함수
    const cloneMaterial = (material: Material): Material => {
      if (material instanceof MeshStandardMaterial) {
        const clonedMaterial = new MeshStandardMaterial();
        // 모든 속성을 복사
        clonedMaterial.copy(material);
        // 색상은 새로 생성하여 복사
        if (material.color) {
          clonedMaterial.color = material.color.clone();
        }
        // 다른 맵들도 필요한 경우 복제
        if (material.map) clonedMaterial.map = material.map.clone();
        if (material.normalMap)
          clonedMaterial.normalMap = material.normalMap.clone();
        if (material.roughnessMap)
          clonedMaterial.roughnessMap = material.roughnessMap.clone();
        if (material.metalnessMap)
          clonedMaterial.metalnessMap = material.metalnessMap.clone();
        return clonedMaterial;
      }
      return material.clone();
    };

    const weaponScene = useMemo(() => {
      if (!weaponGltf.scene) return null;

      const cloned = SkeletonUtils.clone(weaponGltf.scene);

      // 모델의 실제 크기 계산
      const box = new Box3().setFromObject(cloned);
      const size = new Vector3();
      const center = new Vector3();
      box.getSize(size);
      box.getCenter(center);

      // 적절한 크기로 자동 스케일 계산
      const targetLength = 100;
      const currentLength = Math.max(size.x, size.y, size.z);
      const scale = targetLength / currentLength;

      // 모델을 원점으로 이동하고 스케일 적용
      cloned.position.sub(center);
      cloned.scale.multiplyScalar(scale);

      // 재질 깊은 복사
      cloned.traverse((child) => {
        child.visible = true;
        child.frustumCulled = false;

        if (child instanceof Mesh) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((mat) => cloneMaterial(mat));
          } else {
            child.material = cloneMaterial(child.material);
          }
        }
      });

      return cloned;
    }, [weaponGltf]);

    useEffect(() => {
      if (!weaponScene) return;

      // 총구 위치용 빈 오브젝트 생성
      const muzzlePoint = new Group();
      muzzlePoint.name = 'muzzlePoint';
      // 총구 위치 설정 (상수 사용)
      muzzlePoint.position.copy(
        FPS_GAME_CONSTANTS.WEAPON_SETTINGS.MUZZLE_POSITION
      );
      weaponScene.add(muzzlePoint);
    }, [weaponScene]);

    useEffect(() => {
      if (!weaponScene || mountedRef.current) return;

      const targetHand = hand === 'left' ? leftHand : rightHand;
      if (!targetHand || !targetHand.parent) return;

      // 기존 무기가 있다면 제거하되, Bone의 다른 속성은 유지
      const existingWeapon = targetHand.children.find((child) =>
        child.name.includes('weapon')
      );
      if (existingWeapon) {
        existingWeapon.removeFromParent();
      }
      // 무기를 본에 추가
      targetHand.add(weaponScene);

      // 무기의 위치와 회전 설정
      weaponScene.position.copy(position);
      weaponScene.rotation.copy(rotation);

      // ref 설정 부분에서도 타입 단언 사용
      if (typeof ref === 'function') {
        ref(weaponScene as Group);
      } else if (ref) {
        (ref as React.MutableRefObject<Group | null>).current =
          weaponScene as Group;
      }

      weaponScene.updateMatrix();
      weaponScene.updateMatrixWorld(true);

      // 본의 행렬 업데이트 연결 복원
      targetHand.matrixWorldNeedsUpdate = true;
      targetHand.parent.updateMatrixWorld(true);

      mountedRef.current = true;

      return () => {
        if (weaponScene.parent) {
          weaponScene.removeFromParent();
        }
        mountedRef.current = false;
      };
    }, [weaponScene, leftHand, rightHand, hand, position, rotation, ref]);

    return null;
  }
);

WeaponRenderer.displayName = 'WeaponBase';

export default WeaponRenderer;
