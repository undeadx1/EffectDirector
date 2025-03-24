import { create } from 'zustand';
import { MODELS, WEAPON } from '@/game/fps/assets';
import { MAPS } from '@/game/fps/assets';

/** Camera projection type for the game view */
export type CameraType = 'orthographic' | 'perspective';

/** Camera behavior mode for following game action */
export type CameraMode = 'world' | 'player';

export type SceneName = 'signin' | 'lobby' | 'game' | 'end';

/**
 * Game configuration store interface
 * Manages global game settings and state
 */
interface FpsGameStore {
  // Camera settings
  /** Current camera projection type */
  cameraType: CameraType;
  /** Current camera behavior mode */
  cameraMode: CameraMode;
  /** Update camera projection type */
  setCameraType: (type: CameraType) => void;
  /** Update camera behavior mode */
  setCameraMode: (mode: CameraMode) => void;

  // Resource settings
  /** Currently selected character model path */
  selectedModel: string;
  /** Currently selected map type */
  selectedMap: string;
  /** Currently selected weapon */
  selectedWeapon: string;
  /** Update selected character model */
  setSelectedModel: (model: string) => void;
  /** Update selected map type */
  setSelectedMap: (map: string) => void;
  /** Update selected weapon */
  setSelectedWeapon: (weapon: string) => void;

  // Debug settings
  /** Whether debug visualization is enabled */
  isDebugMode: boolean;
  /** Toggle debug visualization mode */
  setDebugMode: (enabled: boolean) => void;

  currentScene: SceneName;
  setCurrentScene: (scene: SceneName) => void;
}

/**
 * Global game store using Zustand
 * Manages game-wide settings and configurations
 *
 * Features:
 * - Camera settings management
 * - Resource selection (models, maps)
 * - Debug mode configuration
 *
 * @example
 * ```tsx
 * const { cameraType, selectedMap } = useGameStore();
 * ```
 */
export const useFpsGameStore = create<FpsGameStore>((set) => ({
  // Camera settings
  cameraType: 'orthographic',
  cameraMode: 'world',
  setCameraType: (type) => set({ cameraType: type }),
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Resource settings
  selectedModel: MODELS.SOLIDER,
  selectedMap: MAPS.SHOOTER_BRIDGE,
  selectedWeapon: WEAPON.AK47,
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedWeapon: (weapon) => set({ selectedWeapon: weapon }),
  setSelectedMap: (map) => set({ selectedMap: map }),

  // Debug settings
  isDebugMode: false,
  setDebugMode: (enabled) => set({ isDebugMode: enabled }),

  currentScene: 'signin',
  setCurrentScene: (scene) => set({ currentScene: scene }),
}));
