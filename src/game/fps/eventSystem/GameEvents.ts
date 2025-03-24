// GameEvents.ts - 게임 이벤트 헬퍼 함수

import { Vector3 } from 'three';
import { FPS_GAME_EVENTS } from '../constants/game.constants';
import eventBus, { EventListener, EventObject } from './EventBus';

/**
 * 게임 이벤트를 위한 타입 정의 (타입 안전성 확보)
 */
export interface GameEventMap {
  [FPS_GAME_EVENTS.PLAYER_WEAPON_SHOOT_EVENT]: undefined;
  [FPS_GAME_EVENTS.PLAYER_DAMAGE_EVENT]: {
    userId: string;
    amount: number;
    attackerId: string;
    attackerPosition?: Vector3;
  };
  [FPS_GAME_EVENTS.MY_PLAYER_DAMAGE_FLASH_EVENT]: { direction?: string };
  [FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_NORTH]: undefined;
  [FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_SOUTH]: undefined;
  [FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_EAST]: undefined;
  [FPS_GAME_EVENTS.DAMAGE_FLASH_EVENT_WEST]: undefined;
  [FPS_GAME_EVENTS.MY_PLAYER_REBIRTH_EVENT]: undefined;
  [FPS_GAME_EVENTS.YOU_DIE_AND_WAIT_EVENT]: undefined;
  [FPS_GAME_EVENTS.TOGGLE_SCOREBOARD_EVENT]: { visible: boolean };
  [FPS_GAME_EVENTS.AMMO_UPDATE_EVENT]: { current: number; max: number };
  [FPS_GAME_EVENTS.AMMO_EMPTY_EVENT]: undefined;
  [FPS_GAME_EVENTS.RELOAD_START_EVENT]: undefined;
  [FPS_GAME_EVENTS.RELOAD_PROGRESS_EVENT]: {
    progress: number;
    message?: string;
  }; // 재장전 진행 상황과 선택적 메시지
  [FPS_GAME_EVENTS.RELOAD_COMPLETE_EVENT]: { current: number; max: number };
  [FPS_GAME_EVENTS.WEAPON_CHANGE_EVENT]: {
    weaponType: string;
    userId?: string;
  }; // 무기 변경 이벤트 (userId 추가)
}

/**
 * 게임 이벤트 헬퍼 클래스
 * 기존 코드를 최소한으로 수정하면서 window 대신 EventBus를 사용할 수 있게 합니다
 */
export class GameEvents {
  /**
   * 게임 이벤트 리스너 등록
   * @param eventName 이벤트 이름
   * @param listener 이벤트 핸들러 함수
   */
  public static addEventListener<K extends keyof GameEventMap>(
    eventName: K,
    listener: (event: EventObject<GameEventMap[K]>) => void
  ): void {
    eventBus.addEventListener(eventName, listener);
  }

  /**
   * 게임 이벤트 리스너 제거
   * @param eventName 이벤트 이름
   * @param listener 이벤트 핸들러 함수
   */
  public static removeEventListener<K extends keyof GameEventMap>(
    eventName: K,
    listener: (event: EventObject<GameEventMap[K]>) => void
  ): void {
    eventBus.removeEventListener(eventName, listener);
  }

  /**
   * 게임 이벤트 발생시키기
   * @param eventName 이벤트 이름
   * @param detail 이벤트와 함께 전달할 데이터
   */
  public static dispatchEvent<K extends keyof GameEventMap>(
    eventName: K,
    detail?: GameEventMap[K]
  ): boolean {
    return eventBus.dispatchEvent(eventName, detail);
  }
}

// 애플리케이션 이벤트 리스너 타입 정의
type AppEventListener = EventListener | ((event: CustomEvent) => void);

/**

 * @param eventName 이벤트 이름 
 * @param listener 이벤트 핸들러 함수 (EventListener 타입)
 */
export function addGameEventListener<K extends keyof GameEventMap>(
  eventName: K,
  listener: AppEventListener
): void {
  // EventListener를 EventObject 리스너로 변환
  const wrappedListener = (event: EventObject<GameEventMap[K]>) => {
    // CustomEvent 객체 생성하여 기존 이벤트 리스너에 전달
    const customEvent = {
      type: eventName,
      detail: event.detail,
      // CustomEvent와 유사한 속성들 추가
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: null,
      target: null,
    } as unknown as CustomEvent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener(customEvent as any);
  };

  // 리스너를 wrappedListener 맵에 저장
  if (!listenerMap.has(listener)) {
    listenerMap.set(listener, wrappedListener);
  }

  // 변환된 리스너로 이벤트 버스에 등록
  eventBus.addEventListener(eventName, listenerMap.get(listener)!);
}

/**
 *
 * @param eventName 이벤트 이름
 * @param listener 이벤트 핸들러 함수 (EventListener 타입)
 */
export function removeGameEventListener<K extends keyof GameEventMap>(
  eventName: K,
  listener: AppEventListener
): void {
  // 원래 리스너에 대응하는 wrapped 리스너 찾기
  const wrappedListener = listenerMap.get(listener);

  if (wrappedListener) {
    // 이벤트 버스에서 리스너 제거
    eventBus.removeEventListener(eventName, wrappedListener);
    // 맵에서도 제거
    listenerMap.delete(listener);
  }
}

/**
 *
 * @param eventName 이벤트 이름
 * @param detail 이벤트와 함께 전달할 데이터
 */
export function dispatchGameEvent<K extends keyof GameEventMap>(
  eventName: K,
  detail?: GameEventMap[K]
): boolean {
  //console.log(`Dispatching event: ${eventName}`, detail);
  const result = eventBus.dispatchEvent(eventName, detail);
  //console.log(`Event dispatch result: ${result}`);
  return result;
}

// 원본 리스너와 wrapped 리스너 간의 매핑을 저장하기 위한 Map
const listenerMap = new Map<AppEventListener, EventListener>();

export default GameEvents;
