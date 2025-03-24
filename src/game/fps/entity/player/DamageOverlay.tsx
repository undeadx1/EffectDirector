import React, { useState, useEffect } from 'react';
import { FPS_GAME_EVENTS } from '@/game/fps/constants/game.constants';
import styled, { keyframes, css } from 'styled-components';
import {
  addGameEventListener,
  removeGameEventListener,
} from '@/game/fps/eventSystem/GameEvents';

// 부드러운 페이드인/페이드아웃 애니메이션 (500ms)
const fadeEffect = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

// 화면 전체 플래시 애니메이션 (100ms)
const flashAnimation = keyframes`
  0% { background-color: rgba(255, 0, 0, 0); }
  50% { background-color: rgba(255, 0, 0, 0.3); }
  100% { background-color: rgba(255, 0, 0, 0); }
`;

// 방향별 오버레이 컴포넌트
const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
`;

// 전체 화면 플래시 효과
const ScreenFlash = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'visible',
})<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  will-change: background-color; /* 성능 최적화 */
  ${(props) =>
    props.visible &&
    css`
      animation: ${flashAnimation} 100ms ease-in-out;
      animation-fill-mode: both;
      animation-delay: 0ms;
    `}
`;

// 기본 원형 그라데이션 스타일
interface DirectionalOverlayProps {
  visible: boolean;
  direction: 'north' | 'south' | 'east' | 'west' | 'none';
}

const DirectionalOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !['visible', 'direction'].includes(prop as string),
})<DirectionalOverlayProps>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
  will-change: opacity; /* 성능 최적화 */

  ${(props) =>
    props.visible &&
    css`
      animation: ${fadeEffect} 250ms ease-in-out forwards;
      animation-fill-mode: both;
      animation-delay: 0ms;
    `}

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: ${(props) => {
      if (!props.visible) return 'transparent';

      switch (props.direction) {
        case 'north':
          return 'radial-gradient(ellipse at top, rgba(255, 0, 0, 0.9) 0%, rgba(255, 0, 0, 0.7) 30%, rgba(255, 0, 0, 0) 60%)';
        case 'south':
          return 'radial-gradient(ellipse at bottom, rgba(255, 0, 0, 0.9) 0%, rgba(255, 0, 0, 0.7) 30%, rgba(255, 0, 0, 0) 60%)';
        case 'east':
          return 'radial-gradient(ellipse at right, rgba(255, 0, 0, 0.9) 0%, rgba(255, 0, 0, 0.7) 30%, rgba(255, 0, 0, 0) 60%)';
        case 'west':
          return 'radial-gradient(ellipse at left, rgba(255, 0, 0, 0.9) 0%, rgba(255, 0, 0, 0.7) 30%, rgba(255, 0, 0, 0) 60%)';
        case 'none':
          return 'radial-gradient(circle at center, rgba(255, 0, 0, 0.8) 0%, rgba(255, 0, 0, 0.6) 40%, rgba(255, 0, 0, 0) 60%)';
        default:
          return 'transparent';
      }
    }};
  }
`;

// 방향별 오버레이 위치 조정 컨테이너
const NorthContainer = styled.div`
  position: absolute;
  top: -50%;
  left: 0;
  width: 100%;
  height: 100%;
`;

const SouthContainer = styled.div`
  position: absolute;
  bottom: -50%;
  left: 0;
  width: 100%;
  height: 100%;
`;

const EastContainer = styled.div`
  position: absolute;
  top: 0;
  right: -50%;
  width: 100%;
  height: 100%;
`;

const WestContainer = styled.div`
  position: absolute;
  top: 0;
  left: -50%;
  width: 100%;
  height: 100%;
`;

// 방향이 없을 경우 전체 화면 오버레이 (기존 기능 유지)
const FullOverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const DamageOverlay: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<string | undefined>(undefined);
  const [fadeTimeout, setFadeTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  // 애니메이션 리셋을 위한 키 추가
  const [animationKey, setAnimationKey] = useState(0);

  const handleDamageFlash = (event: Event) => {
    // CustomEvent의 detail에서 방향 정보 추출
    const customEvent = event as CustomEvent;
    const hitDirection = customEvent.detail?.direction;

    console.log('Damage flash event received with direction:', hitDirection);

    // 애니메이션 리셋을 위해 키 증가
    setAnimationKey((prev) => prev + 1);

    // 방향 상태 업데이트
    setDirection(hitDirection);
    setVisible(true);

    // 기존 타이머가 있으면 클리어
    if (fadeTimeout) {
      clearTimeout(fadeTimeout);
    }

    // 애니메이션 지속 시간과 일치하는 타이머 설정
    const timer = setTimeout(() => {
      setVisible(false);
      setDirection(undefined);
    }, 500); // 방향성 표기 애니메이션 길이와 일치시켜 부드럽게 사라지도록 함

    setFadeTimeout(timer);
  };

  useEffect(() => {
    // 이벤트 리스너 등록
    addGameEventListener(
      FPS_GAME_EVENTS.MY_PLAYER_DAMAGE_FLASH_EVENT,
      handleDamageFlash
    );

    // 컴포넌트 언마운트 시 정리
    return () => {
      removeGameEventListener(
        FPS_GAME_EVENTS.MY_PLAYER_DAMAGE_FLASH_EVENT,
        handleDamageFlash
      );
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [fadeTimeout]);

  return (
    <OverlayContainer key={animationKey}>
      {/* 화면 전체 플래시 효과 */}
      <ScreenFlash visible={visible} />

      {/* 방향별 원형 그라데이션 오버레이 */}
      <NorthContainer>
        <DirectionalOverlay
          visible={visible && direction === 'north'}
          direction="north"
        />
      </NorthContainer>

      <SouthContainer>
        <DirectionalOverlay
          visible={visible && direction === 'south'}
          direction="south"
        />
      </SouthContainer>

      <EastContainer>
        <DirectionalOverlay
          visible={visible && direction === 'east'}
          direction="east"
        />
      </EastContainer>

      <WestContainer>
        <DirectionalOverlay
          visible={visible && direction === 'west'}
          direction="west"
        />
      </WestContainer>

      {/* 방향 정보가 없는 경우 전체 화면 오버레이 (기존 기능) */}
      <FullOverlayContainer>
        <DirectionalOverlay visible={visible && !direction} direction="none" />
      </FullOverlayContainer>
    </OverlayContainer>
  );
};

export default DamageOverlay;
