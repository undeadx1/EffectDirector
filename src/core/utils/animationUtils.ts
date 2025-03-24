import * as THREE from 'three';
import { AnimationAction, Bone, Object3D } from 'three';
import {
  SHARED_ANIMATION_POOL,
  ExternalAnimationKey,
  RIG_BONE_PATTERNS,
} from '@/core/assets/animations';
import { RigType } from '@/core/types';

/**
 * Extract bone names from a 3D model
 * @param model 3D model group
 * @returns Array of bone names
 */
const extractBoneNames = (model: THREE.Object3D): string[] => {
  const boneNames: string[] = [];

  model.traverse((object: Object3D) => {
    if (object instanceof Bone) {
      boneNames.push(object.name);
    }
  });

  return boneNames;
};

/**
 * Function to identify rig structure
 * @param bones Array of model bones
 * @returns Detected rig type or UNKNOWN
 */
const detectRigType = (bones: string[]): RigType => {
  // Return UNKNOWN if no bones
  if (!bones.length) {
    return 'UNKNOWN';
  }

  // Convert all bone names to lowercase
  const lowerBones = bones.map((bone) => bone.toLowerCase());

  // 1. Check for MIXAMO - identify as MIXAMO if any bone contains 'mixamorig'
  const isMixamo = lowerBones.some((bone) =>
    RIG_BONE_PATTERNS.MIXAMO.ROOT.some((pattern) => bone.includes(pattern))
  );

  if (isMixamo) {
    return 'MIXAMO';
  }

  // 2. Check for MESHY - verify if essential bone categories exist
  // Essential categories (only checking core categories, not all)
  const essentialCategories = ['SPINE', 'HEAD', 'ARMS', 'LEGS'];

  // Check if at least one bone exists for each essential category
  const hasMeshyBoneStructure = essentialCategories.every((category) => {
    const patterns = RIG_BONE_PATTERNS.MESHY[category];

    // Check if any bone matches any pattern in the category
    const hasMatch = lowerBones.some((bone) =>
      patterns.some((pattern) => bone.includes(pattern))
    );

    return hasMatch;
  });

  if (hasMeshyBoneStructure) {
    return 'MESHY';
  }

  // 3. Return UNKNOWN as default
  return 'UNKNOWN';
};

/**
 * Get animation path based on rig type
 * @param animationType Animation type
 * @param rigType Rig type
 * @returns Animation file path or null
 */
export const getAnimationPathByRigType = (
  animationType: ExternalAnimationKey,
  rigType: RigType
): string | null => {
  const animationData = SHARED_ANIMATION_POOL[animationType];

  // Do not apply animation for UNKNOWN type
  if (rigType === 'UNKNOWN') {
    return null;
  }

  return animationData.paths[rigType] || null;
};

/**
 * Detect the rig type of a 3D model
 * @param model 3D model group
 * @returns Detected rig type
 */
export const detectModelRigType = (model: THREE.Object3D): RigType => {
  const boneNames = extractBoneNames(model);
  return detectRigType(boneNames);
};

/**
 * Function to find animation action
 *
 * Process:
 * 1. Get list of keywords
 * 2. Search built-in animations first
 * 3. Search external animations
 *
 * @param currentAnimation Current animation type
 * @param actions Animation action map
 * @returns Found animation action or null
 */
export const findAnimationAction = <ActionType extends string>(
  currentAnimation: ActionType,
  actions: Record<string, AnimationAction | null>
): AnimationAction | null => {
  // Filter valid actions
  const validActions = Object.entries(actions).filter(
    ([, action]) => action !== null
  );

  if (validActions.length === 0) return null;

  // Get animation keywords
  const animationType = currentAnimation as unknown as ExternalAnimationKey;
  const animData = SHARED_ANIMATION_POOL[animationType];
  const keywords = animData?.keywords || [];

  // Separate built-in and external animations
  const builtInActions = validActions.filter(
    ([name]) =>
      name.includes('|') || (!name.includes('/') && !name.includes('.'))
  );

  const externalActions = validActions.filter(
    ([name]) =>
      !name.includes('|') && (name.includes('/') || name.includes('.'))
  );

  // Keyword-based search function
  const findByKeywords = (actionList: [string, AnimationAction | null][]) => {
    // Exact match search
    for (const keyword of keywords) {
      const exactMatch = actionList.find(
        ([name]) => name.toLowerCase() === keyword.toLowerCase()
      );
      if (exactMatch) return exactMatch[1];
    }

    // Partial match search
    for (const keyword of keywords) {
      const partialMatch = actionList.find(([name]) => {
        if (name.includes('|')) {
          return name
            .toLowerCase()
            .split('|')
            .some((part) => part.includes(keyword.toLowerCase()));
        }
        return name.toLowerCase().includes(keyword.toLowerCase());
      });
      if (partialMatch) return partialMatch[1];
    }

    return null;
  };

  // 1. Search built-in animations first
  const builtInMatch = findByKeywords(builtInActions);
  if (builtInMatch) return builtInMatch;

  // 2. Search external animations
  const externalMatch = findByKeywords(externalActions);
  if (externalMatch) return externalMatch;

  return null;
};
