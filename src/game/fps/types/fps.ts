import {
  BaseRoomState,
  BaseRoomUserState,
  BaseGlobalUserState,
  BaseCharacterState,
} from '@/core/types/base';
import { FpsCharacterActionType } from '@/game/fps/config/action';

export interface FpsUserProfile {
  username: string;
}

export interface FpsGlobalUserState extends BaseGlobalUserState {
  profile: FpsUserProfile;
}

type FpsGameState = 'LOBBY' | 'PLAYING' | 'FINISHED';

export interface FpsRoomState extends BaseRoomState {
  status: FpsGameState;
}

export interface FpsCharacterState
  extends BaseCharacterState<FpsCharacterActionType> {
  isGrounded: boolean;
  updateTimestamp?: number;
  modelPath: string;
  currentHp: number;
  lastAttackerPosition: {
    x: number;
    y: number;
    z: number;
  };
  verticalAim: number;
  pact: number;
  score: number;
  weaponType: string;
}

export interface FpsPlayerState {
  profile: FpsUserProfile;
  stats: {
    maxHp: number;
    attackPower: number;
  };
}

export interface FpsRoomUserState extends BaseRoomUserState {
  ready: boolean;
  characterState: FpsCharacterState;
  playerState: FpsPlayerState;
}

export const DEFAULT_FPS_PLAYER_STATE: FpsPlayerState = {
  profile: {
    username: '',
  },
  stats: {
    maxHp: 100,
    attackPower: 10,
  },
} as const;
