/**
 * Character related constants
 */
export const FPS_CHARACTER_CONSTANTS = {
  // Animation related constants
  ANIMATION: {
    FADE_DURATION: 0.2,
    DEFAULT_DURATION: 0.5,
  },

  // Physics related constants
  PHYSICS: {
    MASS: 1,
    INITIAL_HEIGHT: 1,
    MOVE_SPEED: 2,
    RUN_SPEED: 2.5,
    JUMP_FORCE: 1,
    ROTATION: {
      ENABLED_AXES: [false, false, false] as [boolean, boolean, boolean],
      LERP_FACTOR: 10,
    },
    COLLIDER: {
      HEIGHT: 1,
      RADIUS: 0.3,
    },
  },

  // Shadow related constants
  SHADOW: {
    ENABLED: true,
    CAST: true,
    RECEIVE: true,
  },

  // Initial state
  INITIAL_STATE: {
    POSITION: [0, 0, 0] as [number, number, number],
    ROTATION: [0, 0, 0, 1] as [number, number, number, number],
  },
} as const;
