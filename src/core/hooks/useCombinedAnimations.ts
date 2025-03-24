import { AnimationClip, Group } from 'three';
import { useMemo } from 'react';
import { useAnimations } from '@react-three/drei';

/**
 * Hook for managing character animations
 *
 * This hook combines built-in animations from the model with shared animations
 * from external sources. It prioritizes built-in animations when available.
 *
 * @param scene - The 3D model group/scene
 * @param builtInAnimations - Optional array of animations included with the model
 * @param sharedAnimations - Optional array of shared animations to use as fallback
 * @returns Animation controls from useAnimations hook
 */
export const useCombinedAnimations = (
  scene: Group,
  builtInAnimations?: AnimationClip[],
  sharedAnimations: AnimationClip[] = []
) => {
  // Determine which animations to use (built-in or shared)
  const animationClips = useMemo(() => {
    // Prioritize built-in animations if available
    if (builtInAnimations?.length) {
      return builtInAnimations.map((anim) => {
        const clone = anim.clone();
        clone.userData = { ...clone.userData, isBuiltIn: true };
        return clone;
      });
    }

    // Fall back to shared animations if no built-in animations exist
    return sharedAnimations.map((anim) => {
      const clone = anim.clone();
      clone.userData = { ...clone.userData, isExternal: true };
      return clone;
    });
  }, [builtInAnimations, sharedAnimations, scene]);

  // Use drei's useAnimations hook to create animation actions
  return useAnimations(animationClips, scene);
};
