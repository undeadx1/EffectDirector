import { AnimationConfig } from '@/core/types';
import { FpsCharacterActionType } from '@/game/fps/config/action';

/**
 * Game-specific animation configuration that extends base animation config
 */
export type FpsAnimationConfig = AnimationConfig<FpsCharacterActionType>;
