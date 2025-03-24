import { useEffect, useState } from 'react';
import { Bone, Group, Object3D, Vector3 } from 'three';

export interface SpineBones {
  spineBone?: Bone;
}

export const useSpineBones = (scene: Group | null) => {
  const [spineBones, setSpineBones] = useState<SpineBones>({});

  useEffect(() => {
    if (!scene) {
      console.warn('No scene provided to useSpineBones');
      return;
    }

    let firstSpineBone: Bone | undefined;

    scene.traverse((object: Object3D) => {
      // 이미 스파인 본을 찾았다면 더 이상 탐색하지 않음
      if (firstSpineBone) return;

      if (object instanceof Bone) {
        const name = object.name.toLowerCase();

        // spine이 포함된 첫 번째 본 찾기
        if (name.includes('spine')) {
          firstSpineBone = object;
          firstSpineBone.matrixAutoUpdate = false;
          console.log('First spine bone found:', {
            name: object.name,
            position: object.getWorldPosition(new Vector3()),
          });
        }
      }
    });

    setSpineBones({ spineBone: firstSpineBone });
  }, [scene]);

  return spineBones;
};
