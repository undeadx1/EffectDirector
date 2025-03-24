import { FpsAnimationConfig } from '@/game/fps/types/animation';

/**
 * Available character action types
 * Defines all possible states a character can be in
 */
export enum FpsCharacterActionType {
  /** Standing still */
  IDLE = 'IDLE',
  /** Walking at normal speed */
  RUN = 'RUN',
  /** Running at increased speed */
  DIE = 'DIE',
  /** Shooting */
  SHOOT = 'SHOOT',
}

/**
 * Mapping of character actions to their animation configurations
 */
export const FPS_CHARACTER_ANIMATION_MAP: Record<
  FpsCharacterActionType,
  FpsAnimationConfig
> = {
  [FpsCharacterActionType.IDLE]: {
    animationName: 'IDLE',
    loop: true,
    duration: 0.1,
  },
  [FpsCharacterActionType.RUN]: {
    animationName: 'RUN',
    loop: true,
    duration: 0.1,
  },
  [FpsCharacterActionType.DIE]: {
    animationName: 'DIE',
    loop: false,
    duration: 0.2,
  },
  [FpsCharacterActionType.SHOOT]: {
    animationName: 'SHOOT',
    loop: false,
    duration: 0.1,
  },
} as const;
