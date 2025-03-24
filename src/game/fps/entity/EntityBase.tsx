import { Vector3, Group, Mesh, Euler, Quaternion } from 'three';
import React from 'react';
import { default as ShootingSystem } from './ShootingSystem';
import { SpineBones } from '@/game/fps/hooks/useSpineBones'; // Import SpineBones type
import { useEffectStore } from '@/game/fps/store/useEffectStore';
import { MuzzleFlashEffect } from '@/game/fps/effect/EffectComponents';
import { useFpsNetworkStore } from '@/game/fps/store/fpsNetworkStore';
import { RapierRigidBody } from '@react-three/rapier';
import { FpsPlayerState, DEFAULT_FPS_PLAYER_STATE } from '../types/fps';
import { getRandomCorner } from '@/game/fps/environment/mapUtils';

export interface UserInformationProps {
  userName: string;
  userId: string;
}

export interface EntityBaseProps extends UserInformationProps {
  scene: Group;
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
  spineBones?: SpineBones;
  weaponRef?: React.RefObject<Group>;
  startPosition?: Vector3;
  entityRef?: (instance: EntityBase | null) => void;
}

class EntityBase extends React.Component<EntityBaseProps> {
  public isAlive: boolean = true;
  public rigidBodyRef: React.RefObject<RapierRigidBody>;

  public spineBones?: SpineBones;
  public verticalAim: number;
  public weaponRef?: Group;
  public startPosition?: Vector3;
  public userId: string = '';
  public userName: string = '';
  protected shootingSystem: ShootingSystem | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private originalMaterials: Map<Mesh, { color: any }> = new Map();
  private playerStateScribes: (() => void) | null = null;
  private playerState: FpsPlayerState;

  constructor(props: EntityBaseProps) {
    super(props);
    this.userId = props.userId;
    this.userName = props.userName;

    this.rigidBodyRef =
      props.rigidBodyRef || React.createRef<RapierRigidBody>();

    if (this.props.scene) {
      this.props.scene.userData.entityRef = this;
    }

    this.verticalAim = 0;
    this.playerState = DEFAULT_FPS_PLAYER_STATE;

    this.initializeShootingSystem();
  }

  getPlayerState(): FpsPlayerState {
    return this.playerState;
  }

  // Update spine bones reference
  setSpineBones(spineBones?: SpineBones) {
    this.spineBones = spineBones;
    if (this.spineBones?.spineBone) {
      this.spineBones.spineBone.matrixAutoUpdate = false;
    }
  }

  initializeShootingSystem() {
    if (!this.props.scene) return;

    this.shootingSystem = new ShootingSystem({
      parentObject: this.props.scene,
      entityBase: this,
    });
  }

  getAimStartPosition(): Vector3 {
    if (this.weaponRef) {
      const worldPosition = new Vector3();
      this.weaponRef.getWorldPosition(worldPosition);
      return worldPosition;
    }
    return new Vector3();
  }

  getAimTargetPosition(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  getWorldPosition(): Vector3 {
    if (!this.rigidBodyRef.current) return new Vector3();

    const translation = this.rigidBodyRef.current.translation();
    return new Vector3(translation.x, translation.y, translation.z);
  }

  getWorldRotation(): Euler {
    if (!this.rigidBodyRef.current) return new Euler();

    const rotation = this.rigidBodyRef.current.rotation();
    return new Euler().setFromQuaternion(
      new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    );
  }

  getWorldRotationQuaternion(): Quaternion {
    if (this.rigidBodyRef && this.rigidBodyRef.current) {
      const rotation = this.rigidBodyRef.current.rotation();
      return new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    }
    return new Quaternion();
  }

  baseMuzzlePosition(worldPos: Vector3): Vector3 {
    const offset = new Vector3(0, 0, 0);
    offset.applyEuler(this.getWorldRotation());
    return worldPos.add(offset);
  }

  getMuzzlePosition(): Vector3 {
    if (this.weaponRef) {
      // muzzlePoint 찾기
      const muzzlePoint = this.weaponRef.getObjectByName('muzzlePoint');
      if (muzzlePoint) {
        const worldPosition = new Vector3();
        muzzlePoint.getWorldPosition(worldPosition);
        return worldPosition;
      }
    }
    return new Vector3();
  }

  componentDidMount(): void {
    // entityRef를 호출하여 컴포넌트 인스턴스 전달
    if (this.props.entityRef) {
      this.props.entityRef(this);
    }

    this.playerStateScribes = useFpsNetworkStore.subscribe((state) => {
      const newStats = state.roomUsersState[this.userId]?.playerState?.stats;

      if (
        newStats &&
        (!this.playerState ||
          JSON.stringify(this.playerState.stats) !== JSON.stringify(newStats))
      ) {
        this.playerState = { ...this.playerState, stats: newStats };
        console.log('PlayerState updated:', newStats);
      }
    });

    // 초기 상태 설정
    const initialState =
      useFpsNetworkStore.getState().roomUsersState[this.userId]?.playerState;
    if (initialState) {
      this.playerState = initialState;
    }
  }

  componentWillUnmount() {
    if (this.playerStateScribes) {
      this.playerStateScribes(); //unsubscribe
    }
  }

  componentDidUpdate(prevProps: EntityBaseProps) {
    if (prevProps.scene !== this.props.scene) {
      this.initializeShootingSystem();
    }
  }

  muzzleFlash(): void {
    useEffectStore
      .getState()
      .addEffect(MuzzleFlashEffect, this.getMuzzlePosition(), {
        duration: 100,
        scopeId: 'game',
      });
  }

  shoot(distanceOffset: boolean = true): boolean {
    this.muzzleFlash();
    return this.shootingSystem?.shoot(distanceOffset) || false;
  }

  takeDamage(
    amount: number,
    attackerId: string,
    attackerPosition?: Vector3
  ): void {
    console.log(
      this.userId,
      ' - takeDamage : ',
      amount,
      '- attackerId : ',
      attackerId,
      '- attackerPosition : ',
      attackerPosition
    );
    this.flashDamageEffect();
  }

  public Rebirth() {
    this.isAlive = true;
    this.rigidBodyRef.current?.setEnabled(this.isAlive);
    const randomCorner = getRandomCorner();

    setTimeout(() => {
      if (this.rigidBodyRef.current) {
        this.rigidBodyRef.current.setTranslation(randomCorner, true);
      }
    }, 50); // rigidBody 변경사항이 있어 50ms 지연필요
  }

  protected Die(): void {
    this.isAlive = false;
    this.rigidBodyRef.current?.setEnabled(this.isAlive);
  }

  private flashDamageEffect(): void {
    this.applyColorEffect(0xff0000);
  }

  private applyColorEffect(color: number): void {
    if (!this.props.scene) return;

    // Apply the flash color effect
    this.props.scene.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        if (!this.originalMaterials.has(child)) {
          const material = Array.isArray(child.material)
            ? child.material[0]
            : child.material;
          this.originalMaterials.set(child, {
            color: material.color.clone(),
          });
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.color.setHex(color));
        } else {
          child.material.color.setHex(color);
        }
      }
    });

    // Reset to original colors after a short delay
    setTimeout(() => {
      this.props.scene?.traverse((child) => {
        if (child instanceof Mesh && child.material) {
          const originalMaterial = this.originalMaterials.get(child);
          if (originalMaterial) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                mat.color.copy(originalMaterial.color);
                mat.needsUpdate = true;
              });
            } else {
              child.material.color.copy(originalMaterial.color);
              child.material.needsUpdate = true;
            }
          }
        }
      });
    }, 100); // 100ms 후에 원래 색상으로 복원
  }

  public updateSpineRotation() {
    if (!this.spineBones?.spineBone) {
      //console.log('No spine bone found', this.spineBones);
      return;
    }

    const spineBone = this.spineBones.spineBone;

    // 애니메이션 시스템이 업데이트하기 전에 원래 회전 저장
    const originalRotation =
      spineBone.userData.originalQuaternion || spineBone.quaternion.clone();

    //console.log('verticalAim', this.verticalAim);
    // 수동 회전 계산
    const pitchRotation = new Quaternion().setFromEuler(
      new Euler(this.verticalAim, 0, 0)
    );

    // 원래 회전값에 pitch 적용
    const spineRotation = originalRotation.clone();
    spineRotation.multiply(pitchRotation);

    // 본에 새로운 회전값 적용 및 강제 업데이트
    spineBone.quaternion.copy(spineRotation);
    spineBone.updateMatrix();
    spineBone.updateMatrixWorld(true);
  }

  render() {
    const { scene } = this.props;
    if (!scene) return null;

    return (
      <>
        <primitive object={scene} castShadow receiveShadow />
      </>
    );
  }
}

export default EntityBase;
