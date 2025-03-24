import { Vector3, Euler } from 'three';

/** fps gameplay configuration constants */
export const FPS_GAME_CONSTANTS = {
  /** Player-related game rules and limitations */
  PLAYER_SETTINGS: {
    DEFAULT_POSITION: new Vector3(12, 5, 10),
  },

  /** Weapon view model settings */
  WEAPON_SETTINGS: {
    DEFAULT_POSITION: new Vector3(0.0, -1.7, 0),
    DEFAULT_ROTATION: new Euler(0, Math.PI * 1.025, 0),
    MUZZLE_POSITION: new Vector3(3, 1.3, 0.5), // 총구 위치 (로컬 좌표)
  },

  /** Shooting system configuration */
  SHOOTING_SETTINGS: {
    SHOOT_DISTANCE: 1000,
    COOLDOWN_TIME: 50,
    DAMAGE_AMOUNT: 10, // 기본 대미지 (무기 속성으로 대체됨)
    RELOAD_TIME: 2000, // 기본 재장전 시간 (무기 속성으로 대체됨)

    VISUAL_EFFECTS: {
      MUZZLE_FLASH_DURATION: 50,
    },
  },
} as const;

export const FPS_GAME_EVENTS = {
  PLAYER_WEAPON_SHOOT_EVENT: 'player-weapon-shoot',
  PLAYER_DAMAGE_EVENT: 'player-damage-event',
  YOU_DIE_AND_WAIT_EVENT: 'you-die-and-wait',
  MY_PLAYER_DAMAGE_FLASH_EVENT: 'my-player-damage-flash',
  MY_PLAYER_REBIRTH_EVENT: 'my-player-rebirth',
  DAMAGE_FLASH_EVENT_NORTH: 'north',
  DAMAGE_FLASH_EVENT_EAST: 'east',
  DAMAGE_FLASH_EVENT_SOUTH: 'south',
  DAMAGE_FLASH_EVENT_WEST: 'west',
  TOGGLE_SCOREBOARD_EVENT: 'scoreboard-toggle',
  AMMO_UPDATE_EVENT: 'ammo-update',
  AMMO_EMPTY_EVENT: 'ammo-empty',
  RELOAD_START_EVENT: 'reload-start',
  RELOAD_PROGRESS_EVENT: 'reload-progress', // 재장전 진행 상황 (0-100%)
  RELOAD_COMPLETE_EVENT: 'reload-complete',
  WEAPON_CHANGE_EVENT: 'weapon-change', // 무기 변경 이벤트
} as const;

export * from './game.constants';
