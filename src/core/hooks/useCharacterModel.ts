import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { AnimationClip, Group, Mesh, Object3D } from 'three';
import { GLTF, SkeletonUtils } from 'three-stdlib';

/**
 * Hook for loading and cloning 3D character models
 *
 * This hook handles:
 * 1. Loading a GLTF/GLB model from a given path
 * 2. Creating a clone with proper skeleton handling
 * 3. Setting up shadow properties
 * 4. Extracting built-in animations if available
 *
 * @param modelPath - Path to the 3D model file or RPM URL
 * @returns Object containing the cloned scene and built-in animations, or null if loading failed
 */
export const useCharacterModel = (modelPath: string | undefined) => {
  // Load the model using drei's useGLTF hook
  const { scene, animations } = useGLTF(modelPath || '') as GLTF;

  return useMemo(() => {
    if (!modelPath || !scene) return null;

    try {
      // Clone the scene with proper skeleton handling
      const clonedScene = SkeletonUtils.clone(scene) as Group;

      // Set up shadow properties for all meshes
      clonedScene.traverse((child: Object3D) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Extract built-in animations if available
      let builtInAnimations: AnimationClip[] | undefined;

      if (animations?.length > 0) {
        builtInAnimations = animations;
      }

      // Return the processed model data
      return {
        scene: clonedScene,
        animation: builtInAnimations,
      };
    } catch (error) {
      // Handle and log any errors during model processing
      console.error('Failed to load character model:', error);
      console.error('Model path:', modelPath);
      return null;
    }
  }, [modelPath]);
};
