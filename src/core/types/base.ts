import { Transform } from '@/core/types/transform';

export interface BaseGlobalUserState {
  account: string;
}

export interface BaseRoomState {
  $users: string[];
}

export interface BaseRoomUserState {
  account: string;
}

export interface BaseCharacterState<ActionType> {
  transform: Transform;
  currentAction: ActionType;
}
