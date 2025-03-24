import React, { RefObject } from 'react';
import { AnimationClip, Group } from 'three';
import { AnimationConfigMap } from '@/core/types';
import { useAnimationHandler } from '@/core/hooks/useAnimationHandler';
import { useCombinedAnimations } from '@/core/hooks/useCombinedAnimations';

/**
 * BaseCharacter component Props
 * Simplified interface
 */
export interface BaseCharacterProps<ActionType extends string> {
  /** Reference to the character's 3D model group */
  modelRef?: RefObject<Group>;
  /** Character's 3D model scene */
  scene: Group;
  /** Character's built-in animation clips (optional) */
  builtInAnimations?: AnimationClip[];
  /** Character's shared animation clips (optional) */
  sharedAnimations?: AnimationClip[];
  /** Animation configuration map */
  animationConfig: AnimationConfigMap<ActionType>;
  /** Reference to the current character action */
  currentActionRef: RefObject<ActionType | undefined>;
  /** Optional child components */
  children?: React.ReactNode;
}

/**
 * Base character component for 3D model animation support
 * Handles model rendering, animation state management, and shadow setup
 */
export const CharacterRenderer = <ActionType extends string>({
  modelRef,
  scene,
  builtInAnimations,
  sharedAnimations = [],
  animationConfig,
  currentActionRef,
  children,
}: BaseCharacterProps<ActionType>) => {
  // Animation preparation and state management
  const api = useCombinedAnimations(scene, builtInAnimations, sharedAnimations);
  // Animation playback and transition management (using refs)
  useAnimationHandler(currentActionRef, animationConfig, api);
  return (
    <group ref={modelRef}>
      <primitive object={scene} />
      {children}
    </group>
  );
};
