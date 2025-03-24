import { Vector3 } from 'three';
import { Quaternion } from 'three';
import { EntityBaseProps } from '../EntityBase';
import EntityBase from '../EntityBase';
import React, { useEffect, useRef } from 'react';
import { useFpsNetworkStore } from '@/game/fps/store/fpsNetworkStore';
import { FpsRoomUserState } from '../../types/fps';
import { useFrame } from '@react-three/fiber';
import { FPS_GAME_EVENTS } from '@/game/fps/constants/game.constants';
import { useFpsGameNetwork } from '../../hooks/useFpsGameNetwork';
import { FpsCharacterActionType } from '../../config/action';
import {
  addGameEventListener,
  removeGameEventListener,
  dispatchGameEvent,
} from '@/game/fps/eventSystem/GameEvents';
import { Billboard, Text } from '@react-three/drei';
import { FPS_UI_CONSTANTS } from '../../constants/ui.constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withRemotePlaying = (WrappedComponent: any) => {
  const WithRemotePlaying = React.forwardRef((props: EntityBaseProps, ref) => {
    const characterState = useFpsNetworkStore(
      (state: { roomUsersState: Record<string, FpsRoomUserState> }) =>
        state.roomUsersState[props.userId]?.characterState
    );

    const { takeDamage } = useFpsGameNetwork();

    // ======== 참조 및 상태 관리 ========
    const remotePlayerRef = useRef<RemotePlayerBase | null>(null);

    // 원격 플레이어 인스턴스 접근 함수
    const getRemotePlayerInstance = () => {
      return remotePlayerRef.current;
    };

    // Store target position and rotation values
    const targetState = useRef({
      position: new Vector3(),
      rotation: new Quaternion(),
      verticalAim: 0, // 목표 verticalAim 값 저장
    });

    // 현재 verticalAim 값 추적
    const currentVerticalAim = useRef(0);

    // Interpolation settings
    const INTERPOLATION_FACTOR = 0.2; // Interpolation speed (0~1)
    const VERTICAL_AIM_INTERPOLATION_FACTOR = 0.15; // 수직에임 시선 보간 계수

    // 무기 타입 업데이트 처리
    useEffect(() => {
      if (!characterState?.weaponType || !remotePlayerRef.current) return;

      // 원격 플레이어의 무기 정보 설정
      remotePlayerRef.current.weaponType = characterState.weaponType;

      // 무기 변경 이벤트 발생 (렌더링 업데이트용)
      dispatchGameEvent(FPS_GAME_EVENTS.WEAPON_CHANGE_EVENT, {
        weaponType: characterState.weaponType,
        userId: props.userId,
      });

      console.log(
        `원격 플레이어(${props.userId}) 무기 변경: ${characterState.weaponType}`
      );
    }, [characterState?.weaponType, props.userId]);

    // When receiving new Transform from server
    useEffect(() => {
      if (!characterState?.transform) return;

      // Update target position and rotation
      const [x, y, z] = characterState.transform.position;
      targetState.current.position.set(x, y, z);
      const [rx, ry, rz, rw] = characterState.transform.rotation;
      targetState.current.rotation.set(rx, ry, rz, rw);

      // 서버에서 받은 verticalAim 값이 있으면 목표값 업데이트
      if (characterState.verticalAim !== undefined) {
        targetState.current.verticalAim = characterState.verticalAim;
      }

      if (characterState.currentAction === FpsCharacterActionType.SHOOT) {
        getRemotePlayerInstance()?.shoot(false);
      }
    }, [characterState?.transform]);

    // Smoothly interpolate from current position to target position each frame
    useFrame(() => {
      if (!props || !props.rigidBodyRef?.current || !characterState?.transform)
        return;

      if (!props.rigidBodyRef.current.isValid()) {
        console.error('RigidBody is not valid');
        return;
      }

      if (
        !props.rigidBodyRef.current.translation() ||
        !props.rigidBodyRef.current.rotation()
      )
        return;

      const currentPosition = props.rigidBodyRef.current.translation();
      const currentRotation = props.rigidBodyRef.current.rotation();

      // 위치 및 회전 보간 계산
      const newPosition = new Vector3(
        currentPosition.x,
        currentPosition.y,
        currentPosition.z
      ).lerp(targetState.current.position, INTERPOLATION_FACTOR);

      const newRotation = new Quaternion(
        currentRotation.x,
        currentRotation.y,
        currentRotation.z,
        currentRotation.w
      ).slerp(targetState.current.rotation, INTERPOLATION_FACTOR);

      // 물리 객체 위치/회전 업데이트
      props.rigidBodyRef.current.setTranslation(newPosition, true);
      props.rigidBodyRef.current.setRotation(newRotation, true);

      // 새로 추가: spine 회전 업데이트
      const playerInstance = getRemotePlayerInstance();
      if (playerInstance) {
        // verticalAim 보간 처리
        currentVerticalAim.current =
          currentVerticalAim.current +
          (targetState.current.verticalAim - currentVerticalAim.current) *
            VERTICAL_AIM_INTERPOLATION_FACTOR;

        // 보간된 값 적용
        playerInstance.verticalAim = currentVerticalAim.current;
        playerInstance.updateSpineRotation();
      }
    });

    // 데미지 이벤트 핸들러 수정
    useEffect(() => {
      const handlePlayerDamage = (event: CustomEvent) => {
        // 이벤트에서 데이터 추출
        const { userId, attackerId, amount, attackerPosition } =
          event.detail || {};

        // 현재 캐릭터에 해당하는 이벤트인지 확인
        if (userId === props.userId && amount !== undefined) {
          // 다른 플레이어 상태 업데이트 - userId를 전달
          takeDamage(userId, amount, attackerId, attackerPosition);
        }
      };

      // 이벤트 리스너 등록
      addGameEventListener(
        FPS_GAME_EVENTS.PLAYER_DAMAGE_EVENT,
        handlePlayerDamage
      );

      return () => {
        removeGameEventListener(
          FPS_GAME_EVENTS.PLAYER_DAMAGE_EVENT,
          handlePlayerDamage
        );
      };
    }, [props.userId, takeDamage]);

    if (!characterState?.transform) return null;

    // ======== 컴포넌트 렌더링 ========
    return (
      <WrappedComponent
        {...props}
        ref={(instance: RemotePlayerBase | null) => {
          if (instance) {
            // 로컬 ref에 인스턴스 저장
            remotePlayerRef.current = instance;

            // 초기 무기 타입 설정
            if (characterState?.weaponType) {
              instance.weaponType = characterState.weaponType;
            }

            // 외부로 전달된 ref에도 설정
            if (typeof ref === 'function') {
              ref(instance);
            } else if (ref) {
              ref.current = instance;
            }
          }
        }}
      />
    );
  });

  WithRemotePlaying.displayName = `WithRemotePlaying(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithRemotePlaying;
};

class RemotePlayerBase extends EntityBase {
  // 무기 타입 속성 추가
  public weaponType: string = '/models/weapons/ak47.glb';

  constructor(props: EntityBaseProps) {
    super(props);
  }

  override takeDamage(
    amount: number,
    attackerId: string,
    attackerPosition?: Vector3
  ): void {
    super.takeDamage(amount, attackerId, attackerPosition);

    dispatchGameEvent(FPS_GAME_EVENTS.PLAYER_DAMAGE_EVENT, {
      userId: this.userId,
      amount,
      attackerId,
      attackerPosition,
    });
  }

  override getMuzzlePosition(): Vector3 {
    // 캐릭터의 현재 위치 가져오기
    const characterPosition = this.getWorldPosition() || new Vector3();

    // 머즐 오프셋 정의 (캐릭터 로컬 좌표계 기준)
    const muzzleOffset = new Vector3(0, 0.7, 1.2);

    // 수직 에임에 대한 x축 회전 쿼터니언 생성
    const verticalRotation = new Quaternion().setFromAxisAngle(
      new Vector3(1, 0, 0),
      this.verticalAim
    );

    // 먼저 수직 회전(pitch) 적용
    muzzleOffset.applyQuaternion(verticalRotation);

    // 그 다음 캐릭터의 수평 회전(yaw) 적용
    const characterRotation = this.getWorldRotationQuaternion();
    muzzleOffset.applyQuaternion(characterRotation);

    // 캐릭터 위치에 회전된 오프셋 더하기
    return characterPosition.clone().add(muzzleOffset);
  }

  override getAimStartPosition(): Vector3 {
    return this.getMuzzlePosition();
  }

  override getAimTargetPosition(): Vector3 {
    // 캐릭터의 현재 위치 가져오기
    const characterPosition = this.getWorldPosition() || new Vector3();

    // 머즐 오프셋 정의 (캐릭터 로컬 좌표계 기준)
    const muzzleOffset = new Vector3(0, 0.7, 12);

    // 수직 에임에 대한 x축 회전 쿼터니언 생성
    const verticalRotation = new Quaternion().setFromAxisAngle(
      new Vector3(1, 0, 0),
      this.verticalAim
    );

    // 먼저 수직 회전(pitch) 적용
    muzzleOffset.applyQuaternion(verticalRotation);

    // 그 다음 캐릭터의 수평 회전(yaw) 적용
    const characterRotation = this.getWorldRotationQuaternion();
    muzzleOffset.applyQuaternion(characterRotation);

    // 캐릭터 위치에 회전된 오프셋 더하기
    return characterPosition.clone().add(muzzleOffset);
  }

  override shoot(distanceOffset: boolean = true): boolean {
    super.shoot(distanceOffset);
    this.muzzleFlash();
    return true;
  }

  override render() {
    return (
      <>
        {super.render()}
        <Billboard position={[0, 3, 0]} follow={true} scale={[3, 3, 3]}>
          <mesh>
            <planeGeometry args={[this.userName.length * 0.08 + 0.2, 0.2]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          <Text
            position={[0, 0, 0]}
            color="white"
            fontSize={0.11}
            anchorX="center"
            anchorY="middle"
            font={FPS_UI_CONSTANTS.FONT.MAPLESTORY_LIGHT}
          >
            {this.userName}
          </Text>
        </Billboard>
      </>
    );
  }
}

const EntityWithAnotherPlayer = withRemotePlaying(RemotePlayerBase);
export default EntityWithAnotherPlayer;
