import { useEffect, useState } from 'react';
import { Bone, Group, Object3D, Vector3 } from 'three';

export interface HandBones {
  leftHand?: Bone;
  rightHand?: Bone;
  hands: Bone[];
}

export const useHandBones = (scene: Group | null) => {
  const [handBones, setHandBones] = useState<HandBones>({ hands: [] });

  useEffect(() => {
    if (!scene) {
      console.warn('No scene provided to useHandBones');
      return;
    }

    const hands: Bone[] = [];
    let leftHand: Bone | undefined;
    let rightHand: Bone | undefined;

    scene.traverse((object: Object3D) => {
      if (!(object instanceof Bone)) return;

      const name = object.name.toLowerCase();

      // 손가락이 포함된 본 이름 출력
      if (name.includes('hand')) {
        /*         console.log('Potential hand bone:', {
          name,
          isThumb: name.includes('thumb'),
          isFinger:
            name.includes('index') ||
            name.includes('middle') ||
            name.includes('ring') ||
            name.includes('pinky'),
          position: object.getWorldPosition(new Vector3()),
        }); */

        // 손가락 본이 아닌 실제 손 본만 선택
        if (
          !name.includes('thumb') &&
          !name.includes('index') &&
          !name.includes('middle') &&
          !name.includes('ring') &&
          !name.includes('pinky')
        ) {
          if (name.includes('left')) {
            leftHand = object;
            hands.push(object);
            console.log('Found left hand:', object.name);
          }
          if (name.includes('right')) {
            rightHand = object;
            hands.push(object);
            console.log('Found right hand:', object.name);
          }
        }
      }
    });

    console.log('Hand bones result:', {
      leftHand: leftHand?.name,
      rightHand: rightHand?.name,
      leftHandPosition: leftHand?.getWorldPosition(new Vector3()),
      rightHandPosition: rightHand?.getWorldPosition(new Vector3()),
    });

    setHandBones({
      leftHand,
      rightHand,
      hands,
    });
  }, [scene]);

  return handBones;
};
