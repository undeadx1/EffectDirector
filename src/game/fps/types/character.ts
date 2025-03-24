import { Transform } from '@/core/types';
import { FpsCharacterActionType } from '@/game/fps/config/action';

/**
 * Character animation state interface
 */
export interface FpsCharacterAnimationState {
  /** Currently playing animation */
  currentAction: FpsCharacterActionType;
  /** Whether character is on ground */
  isGrounded: boolean;
  /** Last update timestamp */
  updateTimestamp?: number;
}

/**
 * Character model interface
 */
export interface FpsCharacterModel {
  /** Path to character model */
  modelPath: string;
  /** Character transform */
  transform: Transform;
}
