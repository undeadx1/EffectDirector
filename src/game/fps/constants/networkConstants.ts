/** Network state synchronization settings */
export const NETWORK_CONSTANTS = {
  SYNC: {
    /** Update interval in milliseconds */
    INTERVAL_MS: 50,
    /** Minimum position change to trigger sync */
    POSITION_CHANGE_THRESHOLD: 0.01,
    /** Minimum rotation change to trigger sync */
    ROTATION_CHANGE_THRESHOLD: 0.01,
    /** Minimum vertical aim change to trigger sync */
    VERTICAL_AIM_CHANGE_THRESHOLD: 0.01,
  },
} as const;
