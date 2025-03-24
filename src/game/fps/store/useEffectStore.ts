// useEffectStore.ts
import { create } from 'zustand';
import { Vector3, Object3D } from 'three';

interface EffectProps {
  position: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  normal?: Vector3;
  hitObject?: Object3D;
}

export interface Effect {
  id: string;
  component: React.ComponentType<EffectProps>;
  position: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  normal?: Vector3;
  hitObject?: Object3D;
  duration: number;
  createdAt: number;
  scopeId?: string;
}

interface EffectStore {
  effects: Effect[];
  addEffect: (
    component: React.ComponentType<EffectProps>,
    position: Vector3,
    options?: Partial<Omit<Effect, 'id' | 'component' | 'createdAt'>>
  ) => void;
  removeEffect: (id: string) => void;
  clearEffects: () => void;
}

export const useEffectStore = create<EffectStore>((set) => ({
  effects: [],
  addEffect: (component, position, options = {}) => {
    const newEffect: Effect = {
      id: Math.random().toString(36).substr(2, 9),
      component,
      position: position.clone(),
      rotation: options.rotation || new Vector3(),
      scale: options.scale || new Vector3(1, 1, 1),
      normal: options.normal,
      hitObject: options.hitObject,
      duration: options.duration || 1000,
      scopeId: options.scopeId,
      createdAt: Date.now(),
    };

    set((state) => ({
      effects: [...state.effects, newEffect],
    }));

    // Automatically remove effect after duration
    setTimeout(() => {
      set((state) => ({
        effects: state.effects.filter((effect) => effect.id !== newEffect.id),
      }));
    }, newEffect.duration);
  },
  removeEffect: (id) => {
    set((state) => ({
      effects: state.effects.filter((effect) => effect.id !== id),
    }));
  },
  clearEffects: () => {
    set({ effects: [] });
  },
}));

// default export 추가
export default useEffectStore;
