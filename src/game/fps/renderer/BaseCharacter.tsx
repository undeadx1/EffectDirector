import React, { RefObject, Suspense, useEffect, useMemo, useRef } from 'react';
import { useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { AnimationClip, Group } from 'three';
import { AnimationConfig } from '@/core/types';
import { FPS_CHARACTER_CONSTANTS } from '@/game/fps/constants/characterConstants';

/** Animation state from useAnimations hook */
export interface AnimationState {
  /** Map of animation actions */
  actions: { [key: string]: THREE.AnimationAction | null };
  /** Animation mixer */
  mixer: THREE.AnimationMixer;
}

/** Props for the animation handler component */
interface AnimationHandlerProps<ActionType extends string> {
  /** Currently playing animation name */
  currentAnimation?: ActionType;
  /** Animation configuration map */
  animationConfig: Record<
    ActionType,
    Omit<AnimationConfig, 'nextAction'> & {
      animationName: string;
      nextAction?: ActionType;
    }
  >;
  /** Animation state from useAnimations hook */
  animationState: AnimationState;
}

/**
 * Handles animation state and transitions for a character
 * @param currentAnimation - Currently playing animation name
 * @param animationConfig - Animation configuration map
 * @param animationState - Animation state from useAnimations hook
 */
const BaseAnimationHandler = <ActionType extends string>({
  currentAnimation,
  animationConfig,
  animationState: { actions, mixer },
}: AnimationHandlerProps<ActionType>) => {
  const memoizedAnimation = useMemo(() => currentAnimation, [currentAnimation]);

  // 이전 애니메이션 추적을 위한 ref (컴포넌트 레벨)
  const prevAnimationRef = useRef<string | null>(null);

  // Handle animation transitions and playback
  useEffect(() => {
    if (!memoizedAnimation) return;

    const config = animationConfig[memoizedAnimation];
    if (!config) return;

    // Get animation action using the configured animation name
    const action = actions[config.animationName];
    if (!action || !mixer) return;

    // 현재 애니메이션 저장 (다음 감지용)
    prevAnimationRef.current = memoizedAnimation;

    // 모든 동작 중인 애니메이션의 가중치를 서서히 감소시켜 부드럽게 페이드 아웃
    Object.values(actions).forEach((a) => {
      if (a && a !== action && a.isRunning()) {
        a.fadeOut(FPS_CHARACTER_CONSTANTS.ANIMATION.FADE_DURATION);
      }
    });

    // 현재 애니메이션 준비 및 시작
    // 애니메이션이 이미 실행 중이면 리셋하지 않고 가중치만 높임
    if (!action.isRunning()) {
      action.reset();
    }

    // 가중치를 1로 설정하여 완전히 표시되도록 함
    action.setEffectiveWeight(1);

    if (!config.loop) {
      // 비루핑 애니메이션을 시뮬레이션
      // 핵심: 실제로는 루핑으로 설정하되, 한 번만 재생된 것처럼 보이게 함
      action
        .fadeIn(FPS_CHARACTER_CONSTANTS.ANIMATION.FADE_DURATION)
        // 무한 루프로 설정하지만 매우 느린 속도로 설정하여 정지된 것처럼 보이게 함
        .setLoop(THREE.LoopRepeat, Infinity)
        .setEffectiveTimeScale(1) // 처음에는 정상 속도
        .play();

      // 애니메이션의 재생 시간 계산
      const clip = action.getClip();
      const duration = clip.duration;

      // 한 번 재생 후 거의 정지 상태로 만드는 타이머 설정
      const timer = setTimeout(
        () => {
          // 애니메이션이 마지막 프레임 부근에 도달하면 매우 느린 속도로 설정
          // (완전히 멈추면 비활성 상태가 되므로, 매우 느리게 설정)
          action.setEffectiveTimeScale(0.0001);

          // 이 시점에서 원래 finished 이벤트가 발생했을 것이므로, 자동 전환 처리
          if (config.nextAction) {
            const nextConfig = animationConfig[config.nextAction];
            if (nextConfig) {
              const nextAction = actions[nextConfig.animationName];
              if (nextAction) {
                // 현재 애니메이션은 계속 유지하되 가중치를 감소
                action.fadeOut(FPS_CHARACTER_CONSTANTS.ANIMATION.FADE_DURATION);

                // 다음 애니메이션 시작
                nextAction
                  .reset()
                  .fadeIn(FPS_CHARACTER_CONSTANTS.ANIMATION.FADE_DURATION)
                  .setLoop(THREE.LoopRepeat, Infinity)
                  .play();
              }
            }
          }
        },
        duration * 1000 - 50
      ); // 마지막 프레임 직전에 호출

      return () => {
        // 컴포넌트 언마운트 시 타이머 정리
        clearTimeout(timer);
        if (action.isRunning()) {
          action.fadeOut(FPS_CHARACTER_CONSTANTS.ANIMATION.FADE_DURATION);
        }
      };
    }

    // Setup looping animation
    action
      .fadeIn(FPS_CHARACTER_CONSTANTS.ANIMATION.FADE_DURATION)
      .setLoop(THREE.LoopRepeat, Infinity)
      .play();

    return () => {
      if (action.isRunning()) {
        action.fadeOut(FPS_CHARACTER_CONSTANTS.ANIMATION.FADE_DURATION);
      }
    };
  }, [memoizedAnimation, animationConfig, actions, mixer]);

  return null;
};

/** Props for the BaseCharacter component */
export interface BaseCharacterProps<ActionType extends string> {
  /** Current character action */
  currentAction: ActionType;
  /** Reference to the character's 3D model group */
  modelRef?: RefObject<Group>;
  /** Character's 3D model scene */
  scene: Group;
  /** Character's animation clips */
  animations: AnimationClip[];
  /** Animation configuration map */
  animationConfig: Record<
    ActionType,
    Omit<AnimationConfig, 'nextAction'> & {
      animationName: string;
      nextAction?: ActionType;
    }
  >;
  /** Optional child components */
  children?: React.ReactNode;
}

/**
 * Base character component for 3D models with animation support
 * Handles model rendering, animation state management, and shadow setup
 * @param props - Component props
 */
export const BaseCharacter = <ActionType extends string>({
  currentAction,
  modelRef,
  scene,
  animations,
  animationConfig,
  children,
}: BaseCharacterProps<ActionType>) => {
  const animationState = useAnimations(animations, scene);
  const memoizedCurrentAction = useMemo(() => currentAction, [currentAction]);
  const primitive = useMemo(() => <primitive object={scene} />, [scene]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = FPS_CHARACTER_CONSTANTS.SHADOW.CAST;
      child.receiveShadow = FPS_CHARACTER_CONSTANTS.SHADOW.RECEIVE;
    }
  });

  return (
    <Suspense fallback={null}>
      <group ref={modelRef}>
        {primitive}
        <BaseAnimationHandler
          currentAnimation={memoizedCurrentAction}
          animationConfig={animationConfig}
          animationState={animationState}
        />
        {children}
      </group>
    </Suspense>
  );
};
