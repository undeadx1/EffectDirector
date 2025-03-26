import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import EntityBase, { type EntityBaseProps } from '../EntityBase';
import { Camera, Group, Quaternion, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useFixedPlayerStore } from '@/game/fps/store/useFixedPlayerStore';
import { FPS_GAME_EVENTS } from '@/game/fps/constants/game.constants';
import { useGameServer } from '@agent8/gameserver';
import { useFpsGameNetwork } from '../../hooks/useFpsGameNetwork';
import { FpsCharacterActionType } from '../../config/action';
import { NETWORK_CONSTANTS } from '@/game/fps/constants/networkConstants';
import { throttle } from 'lodash';
import { FPS_CHARACTER_CONSTANTS } from '../../constants/characterConstants';
import { useFpsNetworkStore } from '../../store/fpsNetworkStore';
import {
  addGameEventListener,
  removeGameEventListener,
  dispatchGameEvent,
} from '@/game/fps/eventSystem/GameEvents';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';
import { WEAPON } from '@/game/fps/assets';
import {
  getWeaponAttributes,
  WeaponAttributes,
} from '@/game/fps/config/weapon.config';

//어디서 카메라를 조작 하고 있는 것이든 활성화 된 카메라를 가져온다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withLocalPlaying = (WrappedComponent: any) => {
  const WithLocalPlaying = React.forwardRef((props: EntityBaseProps, ref) => {
    const { camera } = useThree();
    const { account } = useGameServer();
    const { updateCharacterState, rebirth, updateWeaponType } =
      useFpsGameNetwork();
    const { setSelectedWeapon } = useFpsGameStore();

    // ======== 참조 및 상태 관리 ========
    const prevHpRef = useRef<number | null>(null);
    const playerBaseRef = useRef<PlayerBase | null>(null);

    // 플레이어 인스턴스 접근 함수
    const getPlayerInstance = () => {
      return playerBaseRef.current;
    };

    // ======== 초기화 및 설정 ========
    // 초기 위치 설정 및 서버 동기화
    useEffect(() => {
      const startPosition = props.startPosition;
      const rigidBodyRef = props.rigidBodyRef;

      if (!account || !rigidBodyRef?.current || !startPosition) return;

      // 물리 객체 초기 위치 설정
      rigidBodyRef.current.setTranslation(startPosition, true);

      // 서버에 초기 상태 동기화
      const playerState =
        useFpsNetworkStore.getState().roomUsersState[account]?.playerState;

      // 현재 선택된 무기 가져오기
      const selectedWeapon = useFpsGameStore.getState().selectedWeapon;

      updateCharacterState({
        currentAction: FpsCharacterActionType.AIM,
        isGrounded: true,
        transform: {
          position: [startPosition.x, startPosition.y, startPosition.z],
          rotation: FPS_CHARACTER_CONSTANTS.INITIAL_STATE.ROTATION,
        },
        currentHp: playerState?.stats?.maxHp,
        verticalAim: -Math.PI,
        updateTimestamp: Date.now(),
        weaponType: selectedWeapon, // 초기 무기 타입 설정
      });
    }, [
      account,
      props.startPosition,
      props.rigidBodyRef,
      updateCharacterState,
    ]);

    // ======== HP 및 데미지 처리 ========
    useEffect(() => {
      if (!account) return;

      const unsubscribe = useFpsNetworkStore.subscribe((state) => {
        const currentHp =
          state.roomUsersState[account]?.characterState?.currentHp;
        const prevHp = prevHpRef.current;

        // HP 감소 감지 및 데미지 처리
        if (prevHp !== null && currentHp !== undefined) {
          const playerInstance = getPlayerInstance();
          if (playerInstance) {
            // HP가 감소한 경우 데미지 처리
            if (currentHp < prevHp) {
              const hpDiff = prevHp - currentHp;
              console.log(
                account,
                `] - HP : ${prevHp} -> ${currentHp} (damage: ${hpDiff})`
              );

              // 공격자 정보 추출
              const lastAttackerPosition =
                state.roomUsersState[account]?.characterState
                  ?.lastAttackerPosition;

              playerInstance.takeDamage(
                hpDiff,
                account,
                new Vector3(
                  lastAttackerPosition.x,
                  lastAttackerPosition.y,
                  lastAttackerPosition.z
                )
              );

              if (currentHp <= 0) {
                playerInstance.Die();
              }
            }
            // HP가 0 이하였다가 다시 양수가 된 경우 (부활)
            else if (prevHp <= 0 && currentHp > 0) {
              playerInstance.Rebirth();
            }
          }
        }

        // 현재 HP 저장
        prevHpRef.current = currentHp;
      });

      return () => unsubscribe();
    }, [account]);

    // ======== 부활 이벤트 ========
    useEffect(() => {
      addGameEventListener(
        FPS_GAME_EVENTS.MY_PLAYER_REBIRTH_EVENT,
        handleRebirth
      );

      return () => {
        removeGameEventListener(
          FPS_GAME_EVENTS.MY_PLAYER_REBIRTH_EVENT,
          handleRebirth
        );
      };
    }, []);

    const handleRebirth = () => {
      if (!account) return;
      console.log('Rebirth event received');
      rebirth(account);
    };

    // 무기 변경 이벤트 처리 함수
    const handleWeaponChange = (weaponType: string) => {
      if (!account || !getPlayerInstance()?.isAlive) return;

      getPlayerInstance()?.setWeapon(weaponType);
      // 스토어에 선택된 무기 업데이트
      setSelectedWeapon(weaponType);

      // 무기 변경 이벤트 발생
      dispatchGameEvent(FPS_GAME_EVENTS.WEAPON_CHANGE_EVENT, { weaponType });

      console.log(`무기 변경: ${weaponType}`);
    };

    // ======== 컴포넌트 렌더링 ========
    return (
      <WrappedComponent
        {...props}
        ref={(instance: PlayerBase | null) => {
          if (instance) {
            // 로컬 ref에 인스턴스 저장
            playerBaseRef.current = instance;

            // 인스턴스에 무기 변경 함수 주입
            if (instance) {
              instance.handleWeaponChange = handleWeaponChange;
            }

            // 외부로 전달된 ref에도 설정
            if (typeof ref === 'function') {
              ref(instance);
            } else if (ref) {
              ref.current = instance;
            }
          }
        }}
        cameraContext={{ camera }}
      />
    );
  });

  WithLocalPlaying.displayName = `WithLocalPlaying(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithLocalPlaying;
};

interface PlayerBaseProps extends EntityBaseProps {
  cameraContext: {
    camera: Camera | null;
  };
}

class PlayerBase extends EntityBase {
  private isPointerLocked: boolean = false;
  private shootInterval: number | null = null;
  protected camera: Camera | null = null;
  protected isShooting: boolean = false;

  // 무기별 탄환 정보를 저장하는 맵
  private weaponAmmoMap: Map<string, { current: number; max: number }> =
    new Map();
  private currentWeaponType: string = WEAPON.AK47;
  private currentWeaponAttributes: WeaponAttributes;

  // 재장전 관련 속성 추가
  isReloading: boolean = false;
  reloadStartTime: number = 0;
  reloadTimer: number | null = null;
  reloadProgressInterval: number | null = null;

  // 무기 변경 핸들러 함수 (withLocalPlaying에서 주입됨)
  handleWeaponChange: (weaponType: string) => void = () => {};

  // 현재 무기의 대미지를 반환하는 메서드
  getCurrentWeaponDamage(): number {
    return this.currentWeaponAttributes.damage;
  }

  getFirstPersonView(): Group | null {
    return useFixedPlayerStore.getState().weaponRenderContainerRef.current;
  }

  getAmmo(): { current: number; max: number } {
    return (
      this.weaponAmmoMap.get(this.currentWeaponType) || { current: 0, max: 0 }
    );
  }

  constructor(props: PlayerBaseProps) {
    super(props);

    this.initCamera(props.cameraContext);
    console.log('scene', this.props.scene);
    this.props.scene.visible = true;

    // 기본 무기 설정
    this.currentWeaponType = WEAPON.AK47;
    this.currentWeaponAttributes = getWeaponAttributes(this.currentWeaponType);

    // 모든 무기에 대한 초기 탄약 정보 설정
    this.initWeaponAmmo();
  }

  // 모든 무기의 탄약 정보 초기화
  private initWeaponAmmo() {
    Object.keys(WEAPON).forEach((key) => {
      const weaponType = WEAPON[key as keyof typeof WEAPON];
      const attributes = getWeaponAttributes(weaponType);
      this.weaponAmmoMap.set(weaponType, {
        current: attributes.maxAmmo,
        max: attributes.maxAmmo,
      });
    });
  }

  // 무기 변경 메서드
  setWeapon(weaponType: string) {
    // 이전 무기와 동일하면 변경하지 않음
    if (this.currentWeaponType === weaponType) {
      console.log(`[PlayerBase] 이미 선택된 무기입니다: ${weaponType}`);
      return;
    }

    // 재장전 중에는 무기 변경 불가
    if (this.isReloading) {
      console.log('재장전 중에는 무기를 변경할 수 없습니다.');
      // 재장전 중 메시지 출력 (UI에 표시)
      dispatchGameEvent(FPS_GAME_EVENTS.RELOAD_PROGRESS_EVENT, {
        progress: -1, // 특수 값으로 메시지 표시 요청
        message: '재장전 중에는 무기를 변경할 수 없습니다.',
      });
      return;
    }

    try {
      console.log(`[PlayerBase] 무기 변경 시작: ${weaponType}`);

      // 연속 발사 중이면 취소
      this.clearShootInterval();

      // 무기 및 속성 변경
      this.currentWeaponType = weaponType;
      this.currentWeaponAttributes = getWeaponAttributes(weaponType);

      // 탄약 상태 업데이트
      this.updateAmmoUI();

      console.log(
        `[PlayerBase] 무기 변경됨: ${this.currentWeaponAttributes.displayName}, 남은 탄약: ${this.getAmmo().current}/${this.getAmmo().max}`
      );
    } catch (error) {
      console.error('[PlayerBase] 무기 변경 중 오류 발생:', error);
      // 오류 발생 시 기본 무기로 폴백
      this.currentWeaponType = WEAPON.AK47;
      this.currentWeaponAttributes = getWeaponAttributes(WEAPON.AK47);
      this.updateAmmoUI();
    }
  }

  // 탄약 UI 업데이트
  private updateAmmoUI() {
    const ammoInfo = this.getAmmo();
    dispatchGameEvent(FPS_GAME_EVENTS.AMMO_UPDATE_EVENT, {
      current: ammoInfo.current,
      max: ammoInfo.max,
    });
  }

  private initCamera(cameraContext: { camera: Camera | null }) {
    if (!cameraContext?.camera) {
      console.warn('No camera available in context');
      return;
    }

    this.camera = cameraContext.camera;
  }

  shootingDone() {
    this.isShooting = false;
  }

  IsShooting() {
    return this.isShooting;
  }

  componentDidUpdate(prevProps: PlayerBaseProps) {
    if (prevProps.cameraContext.camera !== this.camera) {
      this.camera = prevProps.cameraContext.camera;
    }
  }

  componentDidMount() {
    super.componentDidMount();

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    document.addEventListener(
      'pointerlockchange',
      this.handlePointerLockChange
    );
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);

    if (this.props.scene) {
      this.props.scene.addEventListener('click', this.handleCanvasClick);
    }

    // 초기 탄약 상태 이벤트 발생
    dispatchGameEvent(FPS_GAME_EVENTS.AMMO_UPDATE_EVENT, {
      current: this.getAmmo().current,
      max: this.getAmmo().max,
    });
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    // 키보드 이벤트 리스너 제거
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);

    document.removeEventListener(
      'pointerlockchange',
      this.handlePointerLockChange
    );
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);

    if (this.props.scene) {
      this.props.scene.removeEventListener('click', this.handleCanvasClick);
    }

    this.clearShootInterval();
    this.clearReloadTimer();
  }

  // Tab 키 이벤트 처리
  handleKeyDown = (event: KeyboardEvent) => {
    // Tab 키를 눌렀을 때 스코어보드 표시
    if (event.key === 'Tab') {
      event.preventDefault(); // 기본 Tab 키 동작 방지
      dispatchGameEvent(FPS_GAME_EVENTS.TOGGLE_SCOREBOARD_EVENT, {
        visible: true,
      });
    }

    // R 키를 눌렀을 때 재장전 시작
    if (event.key === 'r' || event.key === 'R') {
      this.startReload();
    }

    // 재장전 중에는 무기 변경 불가
    if (this.isReloading) {
      return;
    }

    // 1, 2, 3 키를 눌렀을 때 무기 변경
    if (event.key === '1') {
      this.safeWeaponChangeRequest(WEAPON.AK47);
    } else if (event.key === '2') {
      this.safeWeaponChangeRequest(WEAPON.AK48);
    } else if (event.key === '3') {
      this.safeWeaponChangeRequest(WEAPON.AK49);
    }
  };

  // Tab 키 뗐을 때 이벤트 처리
  handleKeyUp = (event: KeyboardEvent) => {
    // Tab 키를 뗐을 때 스코어보드 숨김
    if (event.key === 'Tab') {
      dispatchGameEvent(FPS_GAME_EVENTS.TOGGLE_SCOREBOARD_EVENT, {
        visible: false,
      });
    }
  };

  showFirstPersonView(enable: boolean) {
    const view = this.getFirstPersonView();
    if (view) {
      view.visible = enable;
    }
  }

  override getMuzzlePosition(): Vector3 {
    const worldPos = this.getWorldPosition();
    return this.baseMuzzlePosition(worldPos);
  }

  override takeDamage(
    amount: number,
    attackerId: string,
    attackerPosition?: Vector3
  ): void {
    if (!this.isAlive) return;
    // 부모 클래스의 takeDamage 호출
    super.takeDamage(amount, attackerId, attackerPosition);

    // 맞은 방향 계산 (attackerPosition이 제공된 경우)
    let hitDirection: string | undefined;

    if (attackerPosition) {
      const playerPosition = this.getWorldPosition();
      const directionVector = new Vector3().subVectors(
        attackerPosition,
        playerPosition
      );

      // 플레이어 기준으로 방향 벡터를 로컬 좌표계로 변환
      const playerRotation = this.getWorldRotationQuaternion();
      const inverseRotation = playerRotation.clone().invert();
      directionVector.applyQuaternion(inverseRotation);

      // 방향 벡터를 정규화하고 가장 큰 성분으로 방향 결정
      directionVector.normalize();

      // 동서남북 방향 결정 (절대값이 가장 큰 축 사용)
      const absX = Math.abs(directionVector.x);
      const absZ = Math.abs(directionVector.z);

      if (absX > absZ) {
        hitDirection =
          directionVector.x > 0
            ? FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_WEST
            : FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_EAST;
      } else {
        hitDirection =
          directionVector.z > 0
            ? FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_NORTH
            : FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_SOUTH;
      }
    }

    // 기존 데미지 플래시 이벤트 유지하되 방향 정보 추가
    console.log(
      'Triggering damage flash event:',
      FPS_GAME_EVENTS.MY_PLAYER_DAMAGE_FLASH_EVENT
    );

    dispatchGameEvent(FPS_GAME_EVENTS.MY_PLAYER_DAMAGE_FLASH_EVENT, {
      direction: hitDirection,
    });
    console.log('Event dispatched with direction:', hitDirection);
  }

  override Rebirth(): void {
    super.Rebirth();
    this.showFirstPersonView(true);
    this.props.scene.visible = true;

    // 부활 시 모든 무기의 탄약 초기화
    this.initWeaponAmmo();

    // 현재 무기의 탄약 상태 UI 업데이트
    this.updateAmmoUI();

    // 재장전 중이었다면 취소
    this.clearReloadTimer();
    this.isReloading = false;
  }

  override Die(): void {
    super.Die();
    this.showFirstPersonView(false);
    this.props.scene.visible = true; //죽으면 내 시체 보여주기
    dispatchGameEvent(FPS_GAME_EVENTS.YOU_DIE_AND_WAIT_EVENT);
  }

  handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === document.body;
  };

  handleCanvasClick = () => {
    if (!this.isPointerLocked) {
      document.body.requestPointerLock();
    }
  };

  handleMouseDown = (event: MouseEvent) => {
    if (this.isAlive == false) return;

    if (event.button === 0) {
      this.startContinuousShooting();
    }
  };

  handleMouseUp = (event: MouseEvent) => {
    if (event.button === 0) {
      this.clearShootInterval();
    }
  };

  override shoot(distanceOffset: boolean = true): boolean {
    // 머즐 플래시 효과 표시
    //this.muzzleFlash();
    // 발사 상태 설정
    this.isShooting = true;
    // 50ms 후 자동으로 발사 상태 해제
    setTimeout(() => {
      this.shootingDone();
    }, 50);

    // 실제 발사 처리
    return this.shootingSystem?.shoot(distanceOffset) || false;
  }

  override getWorldPosition(): Vector3 {
    if (this.rigidBodyRef && this.rigidBodyRef.current) {
      const position = this.rigidBodyRef.current.translation();
      return new Vector3(position.x, position.y, position.z);
    }

    return super.getWorldPosition().clone();
  }

  override getAimStartPosition(): Vector3 {
    if (this.camera) return this.camera.position.clone();
    else return this.getWorldPosition().clone();
  }

  override getAimTargetPosition(): Vector3 {
    if (this.camera) {
      const direction = new Vector3(0, 0, -1);
      direction.applyQuaternion(this.camera.quaternion);
      const result = this.camera.position
        .clone()
        .add(direction.multiplyScalar(10)); //적당히 먼거리리를 향하게
      return result;
    } else {
      return new Vector3(
        this.getAimStartPosition().x,
        this.getAimStartPosition().y,
        this.getAimStartPosition().z - 10
      );
    }
  }

  public override updateSpineRotation() {
    //상체 회전 그래픽 표기는 실제 그래픽 표기할때만 필요함.
    //플레이어 자신의 그래픽은 표기할 필요가 없어서 spine 회전도 필요없음
  }

  private startContinuousShooting() {
    this.fireSingleShot();

    this.clearShootInterval();

    // 현재 무기의 발사 간격 사용
    const fireInterval = this.currentWeaponAttributes.fireInterval;

    this.shootInterval = setInterval(() => {
      this.fireSingleShot();
    }, fireInterval);
  }

  private clearShootInterval() {
    if (this.shootInterval) {
      clearInterval(this.shootInterval);
      this.shootInterval = null;
    }
  }

  private fireSingleShot() {
    if (this.isAlive == false) return;

    // 재장전 중이면 발사 불가
    if (this.isReloading) {
      return;
    }

    // 현재 무기의 탄약 정보 가져오기
    const ammoInfo = this.getAmmo();

    // 탄약이 없으면 발사하지 않고 재장전 시작
    if (ammoInfo.current <= 0) {
      console.log('Out of ammo! Starting reload...');
      // 탄약 없음 이벤트 발생 (UI에서 표시하기 위함)
      dispatchGameEvent(FPS_GAME_EVENTS.AMMO_EMPTY_EVENT);
      // 자동 재장전 시작
      this.startReload();
      return;
    }

    const didShoot = this.shoot();
    if (didShoot) {
      // 탄약 감소
      ammoInfo.current--;
      this.weaponAmmoMap.set(this.currentWeaponType, ammoInfo);

      // 총알 발사 이벤트
      dispatchGameEvent(FPS_GAME_EVENTS.PLAYER_WEAPON_SHOOT_EVENT);

      // 현재 탄약 상태 UI 업데이트
      this.updateAmmoUI();
    }
  }

  // 재장전 시작 메서드
  startReload() {
    const ammoInfo = this.getAmmo();

    // 이미 재장전 중이거나 총알이 가득 차 있거나 죽어있으면 리턴
    if (this.isReloading || ammoInfo.current >= ammoInfo.max || !this.isAlive) {
      return;
    }

    // 현재 무기의 재장전 시간 사용
    const reloadTime = this.currentWeaponAttributes.reloadTime;
    console.log('[PlayerBase] Starting reload... Time:', reloadTime);

    // 재장전 상태 설정
    this.isReloading = true;
    this.reloadStartTime = Date.now();

    // 재장전 시작 이벤트 발생
    dispatchGameEvent(FPS_GAME_EVENTS.RELOAD_START_EVENT);

    // 이전 타이머 및 인터벌 정리
    this.clearReloadTimer();
    this.clearReloadProgressInterval();

    // 재장전 진행 상황 업데이트를 위한 인터벌 생성 (50ms마다 업데이트)
    this.reloadProgressInterval = window.setInterval(() => {
      // 현재 경과 시간 계산
      const elapsedTime = Date.now() - this.reloadStartTime;
      // 진행률 계산 (0-100%)
      const progress = Math.min(
        100,
        Math.floor((elapsedTime / reloadTime) * 100)
      );

      console.log('[PlayerBase] Reload progress:', progress, '%');

      // 진행 상황 이벤트 디스패치
      dispatchGameEvent(FPS_GAME_EVENTS.RELOAD_PROGRESS_EVENT, { progress });

      // 100% 도달 시 인터벌 정리
      if (progress >= 100) {
        this.clearReloadProgressInterval();
      }
    }, 50); // 50ms 간격으로 업데이트하여 더 부드러운 게이지 표시

    // 재장전 완료 타이머 설정
    this.reloadTimer = window.setTimeout(() => {
      console.log('[PlayerBase] Reload timeout complete');
      this.completeReload();
    }, reloadTime);
  }

  // 재장전 완료 메서드
  completeReload() {
    if (!this.isReloading) return;

    console.log('[PlayerBase] Completing reload');

    // 상태 업데이트
    this.isReloading = false;

    // 현재 무기의 탄약 정보 업데이트
    const ammoInfo = this.getAmmo();
    ammoInfo.current = ammoInfo.max;
    this.weaponAmmoMap.set(this.currentWeaponType, ammoInfo);

    // 타이머 및 인터벌 정리
    this.clearReloadTimer();
    this.clearReloadProgressInterval();

    // 재장전 완료 이벤트 발생
    dispatchGameEvent(FPS_GAME_EVENTS.RELOAD_COMPLETE_EVENT, {
      current: ammoInfo.current,
      max: ammoInfo.max,
    });

    // 탄약 상태 업데이트
    this.updateAmmoUI();
  }

  // 재장전 타이머 해제
  clearReloadTimer() {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
    }
  }

  // 재장전 진행 상황 인터벌 해제
  clearReloadProgressInterval() {
    if (this.reloadProgressInterval) {
      clearInterval(this.reloadProgressInterval);
      this.reloadProgressInterval = null;
    }
  }

  // 안전한 무기 변경 요청 (스로틀링 및 오류 처리 적용)
  safeWeaponChangeRequest = throttle(
    (weaponType: string) => {
      try {
        console.log(`[PlayerBase] 무기 변경 요청 전송: ${weaponType}`);
        this.handleWeaponChange(weaponType);
      } catch (error) {
        console.error('[PlayerBase] 무기 변경 요청 전송 중 오류:', error);
        // 요청 실패해도 로컬에는 이미 적용되어 있으므로 별도 조치 필요 없음
      }
    },
    300, // 300ms 스로틀링 적용
    { leading: true, trailing: false }
  );
}

const EntityWithLocalPlayer = withLocalPlaying(PlayerBase);
export default EntityWithLocalPlayer;
