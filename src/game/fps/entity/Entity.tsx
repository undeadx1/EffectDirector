import { forwardRef, useRef, useState } from 'react';
import { Euler, Group, Vector3 } from 'three';
import EntityBase, {
  EntityBaseProps,
  type UserInformationProps,
} from './EntityBase';
import { useEntitySetup } from '@/game/fps/hooks/useEntitySetup';
import WeaponRenderer from '@/game/fps/weapon/WeaponRenderer';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';
import { useSpineBones } from '@/game/fps/hooks/useSpineBones';
import { FPS_CHARACTER_ANIMATION_MAP } from '../config/action';
import { RapierRigidBody } from '@react-three/rapier';
import { BaseCharacter } from '../renderer/BaseCharacter';
import { useFrame } from '@react-three/fiber';
import { FpsCharacterActionType } from '../config/action';

// 클래스와 HOC 컴포넌트 모두 허용하는 타입
type EntityComponentType =
  | React.ComponentType<EntityBaseProps>
  | (new (props: EntityBaseProps) => EntityBase);

interface WrapperProps extends UserInformationProps {
  entityBase: EntityComponentType;
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
  startPosition?: Vector3;
}

const Entity = forwardRef<EntityBase, WrapperProps>((props, ref) => {
  const {
    entityBase: EntityBase,
    userId,
    userName,
    rigidBodyRef: ecctrlRef,
    startPosition,
  } = props;
  const modelRef = useRef<Group>(null);
  const weaponRef = useRef<Group>(null);
  const { selectedWeapon } = useFpsGameStore();
  const { characterState, scene, animations, isLoading } = useEntitySetup({
    userId,
  });
  const spineBones = useSpineBones(scene);
  const [currentAction, setCurrentAction] = useState(
    FpsCharacterActionType.IDLE
  );
  const weaponModelRef = useRef(selectedWeapon);

  // 속도에 따른 액션 업데이트
  useFrame(() => {
    if (!ecctrlRef?.current) return;

    const velocity = ecctrlRef.current.linvel();
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

    if (speed > 0.1) {
      setCurrentAction(FpsCharacterActionType.RUN);
    } else {
      setCurrentAction(FpsCharacterActionType.IDLE);
    }
  });

  if (isLoading || !scene) {
    console.log('Waiting for model to load...', {
      userId,
      characterState,
    });
    return null;
  }

  // Function to pass spine bones to the component
  const entityBaseRef = (componentInstance: EntityBase | null) => {
    if (componentInstance) {
      componentInstance.setSpineBones(spineBones);
      componentInstance.weaponRef = weaponRef.current ?? undefined;

      // 원격 플레이어의 경우, weaponType 속성이 있으면 그 값 사용
      if (
        'weaponType' in componentInstance &&
        typeof componentInstance.weaponType === 'string'
      ) {
        weaponModelRef.current = componentInstance.weaponType;
      }
    }

    // If a forwarded ref is provided, set the ref
    if (typeof ref === 'function') {
      ref(componentInstance);
    } else if (ref && 'current' in ref) {
      (ref as React.MutableRefObject<EntityBase | null>).current =
        componentInstance;
    }
  };

  return (
    <group position={new Vector3(0, -0.9, 0)}>
      {/* 엔티티 */}
      <EntityBase
        entityRef={entityBaseRef}
        userId={userId}
        userName={userName}
        scene={scene}
        rigidBodyRef={ecctrlRef}
        spineBones={spineBones}
        startPosition={startPosition}
      />
      {/* 캐릭터 모델 
      <CharacterRenderer
        modelRef={modelRef}
        currentActionRef={currentActionRef}
        scene={scene}
        sharedAnimations={animations}
        animationConfig={FPS_CHARACTER_ANIMATION_MAP}
      />*/}
      {/* 캐릭터 모델 */}
      <BaseCharacter
        modelRef={modelRef}
        currentAction={currentAction}
        scene={scene}
        animations={animations}
        animationConfig={FPS_CHARACTER_ANIMATION_MAP}
      />

      {/* 무기 
      {scene && (
        <WeaponRenderer
          ref={weaponRef}
          scene={scene}
          weaponModel={selectedWeapon}
          hand="right"
          position={new Vector3(0, 0, 8)}
          rotation={new Euler(Math.PI, -Math.PI / 10, -Math.PI / 2)}
        />
      )}*/}
    </group>
  );
});

Entity.displayName = 'Entity';

export default Entity;
