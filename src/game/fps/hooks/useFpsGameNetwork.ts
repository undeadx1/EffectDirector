import { useCallback, useEffect } from 'react';
import { useGameServer as useFpsGameServer } from '@agent8/gameserver';
import { useFpsNetworkStore } from '@/game/fps/store/fpsNetworkStore';
import { NETWORK_CONSTANTS } from '@/game/fps/constants/networkConstants';
import {
  FpsCharacterState,
  FpsGlobalUserState,
  FpsRoomState,
  FpsRoomUserState,
} from '@/game/fps/types/fps';
import { Vector3 } from 'three';

type CharacterControlledState = Partial<FpsCharacterState>;

export const useFpsGameNetwork = () => {
  const {
    connected,
    remoteFunction,
    subscribeMyState,
    subscribeRoomState,
    subscribeRoomAllUsers,
  } = useFpsGameServer();

  const {
    myState,
    roomUsersState,
    currentRoomId,
    setMyState,
    setRoomState,
    setRoomUserState,
    setCurrentRoomId,
    setRoomMyState,
    isSubscribed,
    setIsSubscribed,
  } = useFpsNetworkStore();

  const debug = false;

  useEffect(() => {
    if (connected && !isSubscribed) {
      setIsSubscribed(true);
      const unsubscribe = subscribeMyState((state: FpsGlobalUserState) => {
        if (debug) console.log('[SUBSCRIBE] MyState:', state);
        setMyState(state);
      });

      return () => {
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch (error) {
            console.warn('Error during unsubscribe:', error);
          }
        }
        setIsSubscribed(false);
      };
    }
  }, [connected]);

  const updateMyUsername = useCallback(
    async (name: string) =>
      await remoteFunction('updateProfile', [{ username: name }], {
        needResponse: true,
      }),
    []
  );

  const updateCharacterState = useCallback(
    async (characterState: Partial<CharacterControlledState>) => {
      characterState.updateTimestamp = Date.now();
      if (debug) console.log('[SEND] CHARACTER:', characterState);

      return await remoteFunction('updateCharacterState', [characterState], {
        needResponse: false,
        throttle: NETWORK_CONSTANTS.SYNC.INTERVAL_MS,
        throttleKey: 'updateCharacter',
      });
    },
    []
  );

  const takeDamage = useCallback(
    async (
      userId: string,
      damageAmount: number,
      attackerId: string,
      position: Vector3
    ) => {
      if (debug)
        console.log('[SEND] TAKE DAMAGE:', userId, damageAmount, position);

      // -5에서 +5 사이의 랜덤 오프셋 생성
      const randomOffset = Math.floor(Math.random() * 11) - 5;
      // 랜덤 오프셋을 적용한 최종 데미지 계산
      const finalDamage = Math.max(1, damageAmount + randomOffset); // 최소 1의 데미지 보장

      return await remoteFunction(
        'takeDamage',
        [userId, finalDamage, attackerId, position],
        {
          needResponse: false,
          throttle: NETWORK_CONSTANTS.SYNC.INTERVAL_MS,
          throttleKey: `takeDamage-${userId}`,
        }
      );
    },
    []
  );

  const rebirth = useCallback(async (userId: string) => {
    if (debug) console.log('[SEND] REBIRTH:', userId);

    return await remoteFunction('rebirth', [userId], {
      needResponse: false,
      throttle: NETWORK_CONSTANTS.SYNC.INTERVAL_MS,
      throttleKey: `rebirth-${userId}`,
    });
  }, []);

  const getFpsRoomState = useCallback(
    async () =>
      await remoteFunction('getFpsRoomState', [], {
        needResponse: true,
      }),
    []
  );

  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!connected) return;

      try {
        const result = await remoteFunction('joinRoom', [roomId], {
          needResponse: true,
        });

        setCurrentRoomId(roomId);

        const newRoomUserState: Partial<FpsRoomUserState> = {
          ready: false,
          playerState: {
            profile: {
              username: myState.profile.username,
            },
            stats: {
              maxHp: 100,
              attackPower: 10,
            },
          },
        };

        setRoomMyState(newRoomUserState);

        return result;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [
      connected,
      remoteFunction,
      setCurrentRoomId,
      myState?.account,
      setRoomMyState,
    ]
  );

  const ready = useCallback(
    async (isReady: boolean = true) => {
      return await remoteFunction('ready', [isReady], {
        needResponse: true,
      });
    },
    [remoteFunction]
  );

  const leaveRoom = useCallback(async () => {
    const result = await remoteFunction('leaveRoom', [], {
      needResponse: true,
    });
    setCurrentRoomId('');
    return result;
  }, []);

  const subscribeRoom = useCallback(
    (roomId: string) => {
      return subscribeRoomState(roomId, (state: FpsRoomState) => {
        if (debug) console.log('[SUBSCRIBE] ROOM:', state);
        setRoomState(state);
      });
    },
    [debug, setRoomState]
  );

  const subscribeRoomUsers = useCallback(
    (roomId: string) => {
      if (!connected) return;

      return subscribeRoomAllUsers(roomId, (userStates: FpsRoomUserState[]) => {
        if (debug) console.log('[SUBSCRIBE] USERS:', userStates);

        userStates.forEach((userState) => {
          setRoomUserState(userState.account, userState);
        });
      });
    },
    [connected, myState?.account, debug, roomUsersState]
  );

  const getPing = useCallback(async () => {
    const startTime = Date.now();
    const response = await remoteFunction('ping', [], {});
    const endTime = Date.now();

    // 왕복 시간(RTT) 계산 (밀리초 단위)
    const pingMs = endTime - startTime;

    return {
      ping: pingMs,
      serverTime: response.timestamp,
      clientTime: endTime,
      timeDiff: endTime - response.timestamp,
    };
  }, []);

  const updateWeaponType = useCallback(async (weaponType: string) => {
    if (debug) console.log('[SEND] WEAPON TYPE:', weaponType);

    return await remoteFunction('updateWeaponType', [weaponType], {
      needResponse: false,
      throttle: NETWORK_CONSTANTS.SYNC.INTERVAL_MS,
      throttleKey: 'updateWeaponType',
    });
  }, []);

  return {
    currentRoomId,
    updateMyUsername,
    getFpsRoomState,
    joinRoom,
    ready,
    leaveRoom,
    updateCharacterState,
    takeDamage,
    rebirth,
    updateWeaponType,
    subscribeRoom,
    subscribeRoomUsers,
    getPing,
  };
};
