import * as THREE from 'three';

/**
 * Add userData property to AnimationClip
 */
declare module 'three' {
  interface AnimationClip {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userData: Record<string, any>;
  }
}

/** Animation configuration interface */
export interface AnimationConfig<ActionType> {
  /** Animation name */
  animationName: string;
  /** Whether the animation should loop */
  loop: boolean;
  /** Optional animation duration in seconds */
  duration?: number;
  /** Next action after the current animation completes */
  nextAction?: ActionType;
  /** Whether to clamp the animation at the last frame when finished */
  clampWhenFinished?: boolean;
}

/**
 * Definition of supported rig types
 */
export type RigType = 'MIXAMO' | 'MESHY' | 'UNKNOWN';

/**
 * Animation metadata interface
 */
export interface AnimationMetadata {
  /** Animation description */
  description: string;
  /** Array of keywords for search */
  keywords: string[];
  /** Animation file paths by rig type */
  paths: Partial<Record<RigType, string>>;
}

/**
 * Animation state interface
 */
export interface AnimationState {
  /** Animation action map */
  actions: Record<string, THREE.AnimationAction | null>;
  /** Animation mixer */
  mixer: THREE.AnimationMixer;
}

/**
 * Animation configuration map type
 */
export type AnimationConfigMap<ActionType extends string> = Record<
  ActionType,
  AnimationConfig<ActionType>
>;
