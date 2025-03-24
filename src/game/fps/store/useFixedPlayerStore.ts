import { create } from 'zustand';
import { Group } from 'three';

interface FixedPlayerStore {
  weaponRenderContainerRef: React.MutableRefObject<Group | null>;
  setWeaponRenderContainerRef: (
    ref: React.MutableRefObject<Group | null>
  ) => void;
}

export const useFixedPlayerStore = create<FixedPlayerStore>((set) => ({
  weaponRenderContainerRef: { current: null },
  setWeaponRenderContainerRef: (ref) => set({ weaponRenderContainerRef: ref }),
}));
