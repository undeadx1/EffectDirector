import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AnimationConfigMap } from '@/core/types';
import { findAnimationAction } from '@/core/utils/animationUtils';

/**
 * Animation constants used throughout the animation system
 */
export const ANIMATION_CONSTANT = {
  /** Duration for fade in/out transitions (seconds) */
  FADE_DURATION: 0.2,
  /** Default animation duration (seconds) */
  DEFAULT_DURATION: 0.5,
} as const;

/**
 * Hook for handling character animations
 *
 * This hook manages animation playback, transitions, and sequencing.
 * It handles fading between animations, setting up animation chains,
 * and managing animation states.
 *
 * @param actionRef - Reference to the current animation action
 * @param animationConfig - Configuration map for all possible animations
 * @param api - Object containing animation actions and mixer
 * @returns void
 */
export const useAnimationHandler = <ActionType extends string>(
  actionRef: React.RefObject<ActionType | undefined>,
  animationConfig: AnimationConfigMap<ActionType>,
  api: {
    actions: Record<string, THREE.AnimationAction | null>;
    mixer: THREE.AnimationMixer;
  }
) => {
  // Reference to store cleanup function for current animation
  const cleanupRef = useRef<(() => void) | null>(null);

  // Track the last played animation action
  const lastPlayedActionRef = useRef<ActionType | undefined>(undefined);

  /**
   * Fades out all animations except the current one
   *
   * @param currentAction - The animation action that should continue playing
   */
  const fadeOutOtherAnimations = useCallback(
    (currentAction: THREE.AnimationAction) => {
      Object.values(api.actions).forEach((a) => {
        if (a && a !== currentAction) {
          if (a.isRunning()) {
            a.fadeOut(ANIMATION_CONSTANT.FADE_DURATION);
          }
        }
      });
    },
    [api.actions]
  );

  /**
   * Sets up the next animation in a sequence
   *
   * This function creates an event listener for the 'finished' event
   * and automatically transitions to the next animation when triggered.
   *
   * @param nextAction - The next animation action to play
   * @returns Cleanup function to remove the event listener
   */
  const setupNextAnimation = useCallback(
    (nextAction: ActionType) => {
      const onFinished = () => {
        // Find the next animation action
        const nextActionObj = findAnimationAction(nextAction, api.actions);

        if (nextActionObj) {
          // Remove event listener and play the next animation
          api.mixer.removeEventListener('finished', onFinished);
          playAnimation(nextAction, nextActionObj);
        }
      };

      // Register event listener for animation completion
      api.mixer.addEventListener('finished', onFinished);

      // Return cleanup function
      return () => api.mixer.removeEventListener('finished', onFinished);
    },
    [api.actions, api.mixer, animationConfig]
  );

  /**
   * Plays an animation with proper configuration and transitions
   *
   * This function handles:
   * - Cleaning up previous animations
   * - Configuring loop and clamp settings
   * - Fading out other animations
   * - Setting up animation sequences
   *
   * @param actionName - Name of the animation to play
   * @param action - The THREE.AnimationAction object
   * @returns Cleanup function
   */
  const playAnimation = useCallback(
    (actionName: ActionType, action: THREE.AnimationAction) => {
      console.log('playAnimation:', actionName);

      // Execute previous cleanup function if exists
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      const config = animationConfig[actionName];
      if (!config) {
        return;
      }
      const { loop = true, clampWhenFinished = false } = config;

      // Fade out other animations
      fadeOutOtherAnimations(action);

      // Configure and play current animation
      action.reset();
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      action.clampWhenFinished = clampWhenFinished;
      action.fadeIn(ANIMATION_CONSTANT.FADE_DURATION);
      action.play();

      // Update last played action reference
      lastPlayedActionRef.current = actionName;

      // Set up next animation if specified and not looping
      const { nextAction } = config;
      if (nextAction && !loop) {
        const cleanup = setupNextAnimation(nextAction);
        cleanupRef.current = cleanup;
        return cleanup;
      }

      return () => {};
    },
    [animationConfig, fadeOutOtherAnimations, setupNextAnimation]
  );

  /**
   * Updates the current animation based on actionRef changes
   *
   * This function checks if the animation needs to be changed
   * and handles the transition to the new animation.
   */
  const updateAnimation = useCallback(() => {
    const currentAnimation = actionRef.current;
    if (!currentAnimation) return;

    // Skip if the same animation is already playing
    if (currentAnimation === lastPlayedActionRef.current) {
      const action = findAnimationAction(currentAnimation, api.actions);

      if (action && action.isRunning()) {
        return;
      }
    }

    // Find the action for the current animation
    const action = findAnimationAction(currentAnimation, api.actions);

    if (action) {
      // Play the animation and store cleanup function
      playAnimation(currentAnimation, action);
    }
  }, [animationConfig, api.actions, actionRef.current, playAnimation]);

  // Effect to handle animation changes and setup
  useEffect(() => {
    // Initialize animation on mount
    updateAnimation();

    /**
     * Function to check for animation changes on each loop
     * This ensures animations are updated when needed
     */
    const checkForAnimationChanges = () => {
      updateAnimation();
    };

    // Listen for animation loop events to check for changes
    api.mixer.addEventListener('loop', checkForAnimationChanges);

    // Cleanup event listener on unmount
    return () => {
      api.mixer.removeEventListener('loop', checkForAnimationChanges);
    };
  }, [api.mixer, updateAnimation]);
};
