import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { AnimationClip } from 'three';
import { useGLTF } from '@react-three/drei';
import { SHARED_ANIMATION_POOL } from '@/core/assets/animations';
import { detectModelRigType } from '@/core/utils/animationUtils';
import { RigType } from '@/core/types';

/**
 * Hook for managing shared animations across different character models
 *
 * Strategy:
 * 1. Detect the model's rig type (skeleton structure)
 * 2. Load appropriate shared animations for that rig type
 * 3. Optimize performance through caching
 *
 * This hook allows different character models to use the same animations
 * by matching animations to the appropriate skeleton structure.
 *
 * @param model - The 3D model object to analyze and load animations for
 * @param animKeys - Array of animation keys to load (empty array loads all animations)
 * @returns Array of loaded animation clips
 */
export const useSharedAnimations = (
  model: THREE.Object3D | null,
  animKeys: string[]
): AnimationClip[] => {
  // Detect the model's rig type (memoized)
  const rigType = useMemo(() => {
    if (!model) return 'UNKNOWN' as RigType;
    return detectModelRigType(model);
  }, [model]);

  // Determine required animation paths based on rig type (memoized)
  const animationPaths = useMemo(() => {
    if (!model || rigType === 'UNKNOWN') return {};

    const paths: Record<string, string> = {};

    // If animKeys is empty, load all available animations
    const keysToLoad =
      animKeys.length === 0 ? Object.keys(SHARED_ANIMATION_POOL) : animKeys;

    keysToLoad.forEach((animKey) => {
      // Get animation path for the detected rig type
      const animData = SHARED_ANIMATION_POOL[animKey];
      if (animData && animData.paths[rigType]) {
        paths[animKey] = animData.paths[rigType] as string;
      }
    });

    return paths;
  }, [model, rigType, animKeys]);

  // Load shared animations from determined paths (memoized)
  const animations = useMemo(() => {
    const result: AnimationClip[] = [];

    Object.entries(animationPaths).forEach(([animKey, url]) => {
      try {
        const gltf = useGLTF(url);
        if (gltf && gltf.animations?.length) {
          // Clone the first animation clip and rename it
          const clip = gltf.animations[0].clone();
          clip.name = animKey; // Use animation key as the name

          result.push(clip);
        }
      } catch (error) {
        console.error(
          `Failed to load animation ${animKey}, ${animationPaths[animKey]}:`,
          error
        );
      }
    });

    return result;
  }, [animationPaths]);

  // Debug logging (only in development mode)
  useEffect(() => {
    if (model && rigType) {
      console.log('Loaded shared animations:', {
        rigType,
        requiredTypes: animKeys.length === 0 ? 'ALL' : animKeys,
        loadedPaths: Object.keys(animationPaths),
        totalAnimations: animations.length,
        animationNames: animations.map((a) => a.name),
      });
    }
  }, [animations, animationPaths, animKeys, model, rigType]);

  return animations;
};
