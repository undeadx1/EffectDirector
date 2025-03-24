import { SHARED_ANIMATION_POOL } from '@/core/assets';

/** Character animation file paths for various actions */
export const ANIMATIONS = {
  IDLE: SHARED_ANIMATION_POOL.IDLE,
  AIM: SHARED_ANIMATION_POOL.AIM,
  SHOOT: SHARED_ANIMATION_POOL.SHOOT,
  RUN: SHARED_ANIMATION_POOL.RUN,
  DIE: SHARED_ANIMATION_POOL.DIE,
} as const;
