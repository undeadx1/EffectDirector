import {
  FpsGlobalUserState,
  FpsRoomState,
  FpsRoomUserState,
} from '@/game/fps/types/fps';
import { createNetworkStore } from '@/core/store';

const initialState = {
  account: undefined,
  myState: {
    account: '',
    profile: {
      username: '',
    },
  } as FpsGlobalUserState,
  roomState: {
    $users: [],
    status: 'LOBBY',
  } as FpsRoomState,
  isSubscribed: false,
};

export const useFpsNetworkStore = createNetworkStore<
  FpsGlobalUserState,
  FpsRoomState,
  FpsRoomUserState
>(initialState);
