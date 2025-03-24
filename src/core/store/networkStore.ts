import { create } from 'zustand';
import {
  BaseGlobalUserState,
  BaseRoomState,
  BaseRoomUserState,
} from '@/core/types/base';

interface NetworkStore<
  TGlobalUserState extends BaseGlobalUserState,
  TRoomState extends BaseRoomState,
  TRoomUserState extends BaseRoomUserState,
> {
  myState: TGlobalUserState;
  roomState: TRoomState;
  roomUsersState: Record<string, TRoomUserState>;
  account: string | undefined;
  currentRoomId: string | undefined;
  isSubscribed: boolean;
  setMyState: (state: Partial<TGlobalUserState>) => void;
  setRoomState: (state: Partial<TRoomState>) => void;
  setRoomMyState: (state: Partial<TRoomUserState>) => void;
  setRoomUserState: (account: string, state: Partial<TRoomUserState>) => void;
  setAccount: (roomId: string) => void;
  setCurrentRoomId: (roomId: string) => void;
  setIsSubscribed: (isSubscribed: boolean) => void;
}

export const createNetworkStore = <
  TGlobalUserState extends BaseGlobalUserState,
  TRoomState extends BaseRoomState,
  TRoomUserState extends BaseRoomUserState,
>(initialState: {
  myState: TGlobalUserState;
  roomState: TRoomState;
}) => {
  return create<NetworkStore<TGlobalUserState, TRoomState, TRoomUserState>>(
    (set) => ({
      myState: initialState.myState,
      roomState: initialState.roomState,
      roomUsersState: {},
      account: undefined,
      currentRoomId: undefined,
      isSubscribed: false,
      setMyState: (state) =>
        set((prev) => ({ myState: { ...prev.myState, ...state } })),
      setRoomState: (state) =>
        set((prev) => ({ roomState: { ...prev.roomState, ...state } })),
      setRoomMyState: (state) =>
        set((prev) => ({
          roomUsersState: {
            ...prev.roomUsersState,
            [prev.myState.account]: {
              ...prev.roomUsersState[prev.myState.account],
              ...state,
            },
          },
        })),
      setRoomUserState: (account, state) =>
        set((prev) => ({
          roomUsersState: {
            ...prev.roomUsersState,
            [account]: {
              ...prev.roomUsersState[account],
              ...state,
            },
          },
        })),
      setAccount: (account) => set({ account: account }),
      setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
      setIsSubscribed: (isSubscribed) => set({ isSubscribed }),
    })
  );
};
