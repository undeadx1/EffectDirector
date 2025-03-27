import {
  Raycaster,
  Vector3,
  Object3D,
  Mesh,
  type Intersection,
  Matrix3,
} from 'three';
import EntityBase from './EntityBase';
import { FPS_GAME_CONSTANTS } from '@/game/fps/constants/game.constants';
import { useEffectStore } from '../store/useEffectStore';
import {
  BulletHole,
  SparkEffect,
  TexturedLaserBeam,
} from '../effect/EffectComponents';
import { FireBallEffect } from '../effect/shaderEffects/FireBallEffect';
import { IceBallEffect } from '../effect/shaderEffects/IceBallEffect';
/**
 * Props for initializing the ShootingSystem
 */
interface ShootingSystemProps {
  parentObject: Object3D | null; // Parent object to attach the shooting system to
  entityBase: EntityBase; // Reference to the entity that owns this shooting system
}

/**
 * Result of a raycast operation containing origin, direction and hit information
 */
interface RaycastResult {
  origin: Vector3; // Starting point of the ray
  direction: Vector3; // Direction of the ray
  hit: Intersection | null; // Information about what was hit, if anything
}

/**
 * Handles shooting mechanics including raycasting, visual effects, and damage
 */
class ShootingSystem {
  private raycaster: Raycaster = new Raycaster();
  private shootDistance: number =
    FPS_GAME_CONSTANTS.SHOOTING_SETTINGS.SHOOT_DISTANCE;

  private props: ShootingSystemProps;
  private isOnCooldown: boolean = false;
  private cooldownTime: number =
    FPS_GAME_CONSTANTS.SHOOTING_SETTINGS.COOLDOWN_TIME;

  constructor(props: ShootingSystemProps) {
    this.props = props;
  }

  /**
   * Performs raycasting to detect potential targets
   * Returns the raycast result containing origin, direction and hit information
   */
  private performRaycast(): RaycastResult | null {
    if (!this.props.parentObject?.parent) return null;

    // Camera-based raycast for precise aiming
    const origin = this.props.entityBase.getAimStartPosition();
    const targetPosition = this.props.entityBase.getAimTargetPosition();

    // 총기 반동 효과를 위한 랜덤 오프셋 적용
    const applyRecoil = () => {
      // 반동 강도 - 값이 클수록 반동이 심해짐
      const verticalRecoilIntensity = 0.2; // 수직 반동 (위아래)
      const horizontalRecoilIntensity = 0.2; // 수평 반동 (좌우) - 더 강하게 설정

      // 원래 방향 벡터 계산
      const originalDirection = targetPosition.clone().sub(origin).normalize();

      // 카메라 기준 오른쪽 벡터 계산 (로컬 X축)
      const rightVector = new Vector3(0, 1, 0)
        .cross(originalDirection)
        .normalize();

      // 카메라 기준 위쪽 벡터 계산 (로컬 Y축)
      const upVector = originalDirection.clone().cross(rightVector).normalize();

      // 랜덤 오프셋 생성
      // 좌우 반동은 +-로 랜덤하게, 상하 반동은 주로 위쪽(+)으로 더 많이 발생
      const horizontalOffset =
        (Math.random() * 2 - 1) * horizontalRecoilIntensity; // -0.05 ~ 0.05
      const verticalOffset =
        (Math.random() * 0.8 + 0.2) * verticalRecoilIntensity; // 0.02 ~ 0.03 (주로 위쪽)

      // 로컬 좌표계 기준으로 반동 적용
      // 타겟 위치에만 반동 적용 (시작점은 고정)
      targetPosition.add(rightVector.multiplyScalar(horizontalOffset));
      targetPosition.add(upVector.multiplyScalar(verticalOffset));
    };

    // 반동 적용
    applyRecoil();

    const direction = targetPosition.clone().sub(origin).normalize();

    this.raycaster.set(origin, direction);
    this.raycaster.far = this.shootDistance;

    // Find the root of the scene
    let sceneRoot = this.props.parentObject;
    while (sceneRoot.parent) {
      sceneRoot = sceneRoot.parent;
    }

    // Collect all potential target objects
    const targetObjects: Object3D[] = [];
    sceneRoot.traverse((object) => {
      if (object instanceof Mesh) {
        let isChildOfSelf = false;
        let current = object;
        while (current.parent) {
          if (current.parent === this.props.parentObject) {
            isChildOfSelf = true;
            break;
          }
          current = current.parent as Mesh;
        }

        // Don't include self in raycast targets
        if (!isChildOfSelf) {
          targetObjects.push(object);
        }
      }
    });

    const hits = this.raycaster.intersectObjects(targetObjects, false);

    return {
      origin,
      direction,
      hit: hits.length > 0 ? hits[0] : null,
    };
  }

  /**
   * Initiates a shooting action, including raycasting, visual effects, and hit detection
   * Returns true if the shot was fired, false if on cooldown
   */
  shoot(distanceOffset: boolean = true): boolean {
    if (this.isOnCooldown || !this.props.parentObject) return false;

    const raycastResult = this.performRaycast();
    if (!raycastResult) return false;

    // Get actual muzzle position for visual effects
    const muzzlePosition = this.props.entityBase.getMuzzlePosition();

    this.createVisualEffects(raycastResult, muzzlePosition, distanceOffset);

    if (raycastResult.hit) {
      this.handleHit(raycastResult.hit);
    }

    // Apply cooldown
    this.isOnCooldown = true;
    setTimeout(() => {
      this.isOnCooldown = false;
    }, this.cooldownTime);

    return true;
  }

  /**
   * Creates visual effects for the shot, including muzzle flash and hit markers
   */
  private createVisualEffects(
    raycastResult: RaycastResult,
    muzzlePosition: Vector3,
    distanceOffset: boolean = true
  ) {
    if (!this.props.parentObject?.parent) return;

    let sceneRoot = this.props.parentObject;
    while (sceneRoot.parent) {
      sceneRoot = sceneRoot.parent;
    }

    // Calculate the end position of the shot
    const hitPosition = raycastResult.hit
      ? raycastResult.hit.point
      : raycastResult.origin
          .clone()
          .add(raycastResult.direction.multiplyScalar(this.shootDistance));

    // 총구 위치에서 타격 지점 방향으로 약간의 오프셋을 주어 시작점 조정
    const direction = hitPosition.clone().sub(muzzlePosition).normalize();
    const offsetDistance = distanceOffset ? 1.5 : 0; // 총구로부터 앞으로 오프셋할 거리 (미터 단위)
    const startPosition = muzzlePosition
      .clone()
      .add(direction.multiplyScalar(offsetDistance));

    // 텍스처 레이저 이펙트 추가
    useEffectStore.getState().addEffect(TexturedLaserBeam, startPosition, {
      duration:
        FPS_GAME_CONSTANTS.SHOOTING_SETTINGS.VISUAL_EFFECTS
          .MUZZLE_FLASH_DURATION,
      scopeId: 'game',
      hitObject: {
        end: hitPosition,
      } as unknown as Object3D,
    });

    if (raycastResult.hit) {
      this.createHitEffect(raycastResult.hit.point);
    }
  }

  /**
   * Creates a hit effect at the point of impact with normal information
   */
  private createHitEffect(position: Vector3) {
    if (!this.raycaster.ray) return;

    // raycast로부터 법선 정보 얻기
    const hit = this.performRaycast()?.hit;
    const normal = hit?.face?.normal
      ? hit.face.normal.clone()
      : this.raycaster.ray.direction.clone().negate();

    // 월드 좌표계 기준 법선 벡터로 변환 (필요시)
    if (hit?.face?.normal && hit.object.matrixWorld) {
      // 월드 공간으로 변환 - 회전만 적용
      const normalMatrix = new Matrix3().getNormalMatrix(
        hit.object.matrixWorld
      );
      normal.applyMatrix3(normalMatrix).normalize();
    }

    // 타겟 개체가 EntityBase인지 확인
    let isEntityBase = false;
    let currentObject: Object3D | null = hit?.object || null;

    while (currentObject) {
      if (currentObject.userData.entityRef instanceof EntityBase) {
        isEntityBase = true;
        break;
      }
      if (currentObject.parent?.userData.entityRef instanceof EntityBase) {
        isEntityBase = true;
        break;
      }
      currentObject = currentObject.parent;
    }

    // EntityBase일 경우 다른 이펙트 적용 (예: 피가 튀는 효과)
    if (isEntityBase) {
      // console.log('Hit an EntityBase object - applying character hit effect');
    } else {
      // 벽에 붙일 때 사용
      useEffectStore.getState().addEffect(FireBallEffect, position, {
        normal: normal,
        duration: 2000,
        scopeId: 'game',
      });
    }
  }

  /**
   * Handles applying damage
   */
  private handleHit(hit: Intersection) {
    // Traverse up the object hierarchy to find an entity reference
    let currentObject: Object3D | null = hit.object;
    let targetEntity: EntityBase | null = null;

    while (currentObject) {
      if (currentObject.userData.entityRef instanceof EntityBase) {
        targetEntity = currentObject.userData.entityRef;
        break;
      }
      if (currentObject.parent?.userData.entityRef instanceof EntityBase) {
        targetEntity = currentObject.parent.userData.entityRef;
        break;
      }
      currentObject = currentObject.parent;
    }

    if (targetEntity) {
      // 기본 공격력 가져오기
      const baseAttackPower =
        this.props.entityBase.getPlayerState().stats.attackPower;

      // 현재 무기의 대미지 가져오기 (메서드가 존재하는 경우)
      let weaponDamage = baseAttackPower;

      // entityBase에 getCurrentWeaponDamage 메서드가 있는지 확인
      if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (this.props.entityBase as any).getCurrentWeaponDamage ===
        'function'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        weaponDamage = (this.props.entityBase as any).getCurrentWeaponDamage();
      }

      // 최종 대미지 적용
      targetEntity.takeDamage(
        weaponDamage,
        this.props.entityBase.userId,
        this.props.entityBase.getWorldPosition()
      );
    }
  }
}

export default ShootingSystem;
