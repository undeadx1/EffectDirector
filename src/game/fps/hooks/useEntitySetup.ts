import { useFpsNetworkStore } from '@/game/fps/store/fpsNetworkStore';
import { FPS_CHARACTER_ANIMATION_MAP } from '../config/action';
import { useModelSetup } from './useModelSetup';
import { FpsRoomUserState } from '../types/fps';
import { MODELS } from '../assets/models';

interface UseEntitySetupProps {
  userId: string;
}

export const useEntitySetup = ({ userId: userId }: UseEntitySetupProps) => {
  // Get character state from store
  const characterState = useFpsNetworkStore(
    (state: { roomUsersState: Record<string, FpsRoomUserState> }) =>
      state.roomUsersState[userId]?.characterState
  );

  // Initialize base model setup
  const { scene, animations, isLoading } = useModelSetup({
    modelPath: MODELS.SOLIDER,
    animationMap: FPS_CHARACTER_ANIMATION_MAP,
  });

  return {
    characterState,
    scene,
    animations,
    isLoading,
  };
};
