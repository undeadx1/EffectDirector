import { AnimationMetadata, RigType } from '@/core/types';

/**
 * Integrated animation data
 * Contains metadata and path information for each animation type
 */
export const SHARED_ANIMATION_POOL: Record<string, AnimationMetadata> = {
  /** Default idle state animation */
  IDLE: {
    description: 'Default idle state animation',
    keywords: ['idle', 'stand', 'waiting'],
    paths: {
      MIXAMO: '/animations/mixamo/idle.glb',
    },
  },
  /** Walking animation */
  WALK: {
    description: 'Walking animation',
    keywords: ['walk', 'walking'],
    paths: {
      MIXAMO: '/animations/mixamo/walk.glb',
    },
  },
  /** Running animation */
  RUN: {
    description: 'Running animation',
    keywords: ['run', 'running', 'sprint'],
    paths: {
      MIXAMO: '/animations/mixamo/run.glb',
    },
  },
  /** Jump animation */
  JUMP_UP: {
    description: 'Jump animation',
    keywords: ['jump', 'jumping', 'leap'],
    paths: {
      MIXAMO: '/animations/mixamo/jump-up.glb',
    },
  },
  /** Mid-air animation */
  FALL_IDLE: {
    description: 'Mid-air animation',
    keywords: ['falling', 'midair'],
    paths: {
      MIXAMO: '/animations/mixamo/fall-idle.glb',
    },
  },
  /** Landing animation */
  FALL_DOWN: {
    description: 'Landing animation',
    keywords: ['land', 'landing', 'fall down'],
    paths: {
      MIXAMO: '/animations/mixamo/fall-down.glb',
    },
  },
  /** Punch animation */
  PUNCH: {
    description: 'Punch animation',
    keywords: ['punch', 'punching', 'hit'],
    paths: {
      MIXAMO: '/animations/mixamo/punch.glb',
    },
  },
  /** Melee attack animation */
  MELEE_ATTACK: {
    description: 'Melee attack animation',
    keywords: ['melee', 'attack', 'slash', 'swing'],
    paths: {
      MIXAMO: '/animations/mixamo/melee-attack.glb',
    },
  },
  /** Aiming animation */
  AIM: {
    description: 'Aiming animation',
    keywords: ['aim', 'targeting'],
    paths: {
      MIXAMO: '/animations/mixamo/aimming.glb',
    },
  },
  /** Aiming animation */
  SHOOT: {
    description: 'Shoot animation',
    keywords: ['shoot', 'shooting'],
    paths: {
      MIXAMO: '/animations/mixamo/shoot.glb',
    },
  },
  /** Running while aiming animation */
  AIM_RUN: {
    description: 'Running while aiming animation',
    keywords: ['rifle run', 'pistol run', 'aim run', 'run shoot'],
    paths: {
      MIXAMO: '/animations/mixamo/aimming-run.glb',
    },
  },
  /** Hit reaction animation */
  HIT: {
    description: 'Hit reaction animation',
    keywords: ['hit', 'hurt', 'damage', 'injured'],
    paths: {
      MIXAMO: '/animations/mixamo/hit.glb',
    },
  },
  /** Death animation */
  DIE: {
    description: 'Death animation',
    keywords: ['death', 'die', 'dead', 'dying'],
    paths: {
      MIXAMO: '/animations/mixamo/death.glb',
    },
  },
} as const;

/**
 * Animation type definition
 */
export type ExternalAnimationKey = keyof typeof SHARED_ANIMATION_POOL;

/**
 * Bone name patterns for identifying rig structures
 * Characteristic bone name patterns for each rig type
 */
export const RIG_BONE_PATTERNS: Record<
  Exclude<RigType, 'UNKNOWN'>,
  Record<string, string[]>
> = {
  MIXAMO: {
    ROOT: ['mixamorig'],
    SPINE: ['spine'],
    HEAD: ['head'],
    ARMS: ['arm'],
    LEGS: ['leg'],
  },
  MESHY: {
    ROOT: ['armature'],
    SPINE: ['spine', 'spine01', 'spine02'],
    HEAD: ['head', 'head_end', 'headfront'],
    ARMS: [
      'leftarm',
      'rightarm',
      'leftforearm',
      'rightforearm',
      'lefthand',
      'righthand',
      'leftshoulder',
      'rightshoulder',
    ],
    LEGS: [
      'leftleg',
      'rightleg',
      'leftupleg',
      'rightupleg',
      'leftfoot',
      'rightfoot',
      'lefttoebase',
      'righttoebase',
    ],
    NECK: ['neck'],
    HIPS: ['hips'],
  },
} as const;
