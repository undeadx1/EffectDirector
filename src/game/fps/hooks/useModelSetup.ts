import { useMemo } from 'react';
import { Group, AnimationClip, Object3D, Mesh } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGLTF } from '@react-three/drei';
import { ANIMATIONS } from '@/game/fps/assets/animations';
import { RigType } from '@/core/types';

// Preload all animation assets
Object.values(ANIMATIONS).forEach((animationMetadata) => {
  Object.entries(animationMetadata.paths).forEach(([path]) => {
    useGLTF.preload(path);
  });
});

interface UseModelSetupProps {
  modelPath: string;
  animationMap?: Record<
    string,
    {
      animationName: string;
      loop: boolean;
      duration?: number;
    }
  >;
  rigType?: RigType;
}

export const useModelSetup = ({
  modelPath,
  animationMap,
  rigType = 'MIXAMO',
}: UseModelSetupProps) => {
  // Load and memoize character model
  console.log('modelPath', modelPath);
  const characterModel = useMemo(() => useGLTF(modelPath ?? ''), [modelPath]);

  // Clone and prepare scene
  const scene = useMemo(() => {
    if (!characterModel?.scene) return null;

    const clonedScene = SkeletonUtils.clone(characterModel.scene);
    clonedScene.traverse((child) => {
      if (child instanceof Object3D) {
        child.updateMatrix();
        child.updateMatrixWorld(true);

        if (child instanceof Mesh) {
          child.userData.isTargetable = true;
          child.material = Array.isArray(child.material)
            ? child.material.map((mat) => mat.clone())
            : child.material.clone();
        }
      }
    });

    return clonedScene as unknown as Group;
  }, [characterModel?.scene]);

  // Load and memoize all character animations
  const loadedAnimations = useMemo(() => {
    if (!animationMap) return null;

    return Object.entries(animationMap).reduce<
      Record<string, ReturnType<typeof useGLTF>>
    >((acc, [key, config]) => {
      const animationName = config.animationName as keyof typeof ANIMATIONS;
      acc[key] = useGLTF(ANIMATIONS[animationName].paths[rigType]!);

      return acc;
    }, {});
  }, [animationMap]);

  // Process and prepare animation clips
  const animations = useMemo(() => {
    if (!loadedAnimations || !animationMap) return [];

    return Object.entries(animationMap)
      .map(([actionKey, config]) => {
        const animData = loadedAnimations[config.animationName];
        if (!animData || !('animations' in animData) || !animData.animations[0])
          return null;
        const clip = animData.animations[0].clone();
        return { clip, name: actionKey };
      })
      .filter(
        (item): item is { clip: AnimationClip; name: string } => item !== null
      )
      .map(({ clip, name }) => Object.assign(clip.clone(), { name }));
  }, [loadedAnimations, animationMap]);

  return {
    scene,
    animations,
    isLoading: !scene,
  };
};
