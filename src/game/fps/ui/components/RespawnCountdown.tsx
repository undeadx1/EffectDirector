import React, { useEffect, useState, useCallback } from 'react';
import { FPS_GAME_EVENTS } from '@/game/fps/constants/game.constants';
import {
  GameEvents,
  dispatchGameEvent,
} from '@/game/fps/eventSystem/GameEvents';

/**
 * RespawnCountdown 컴포넌트 Props
 * @interface RespawnCountdownProps
 */
interface RespawnCountdownProps {
  /** 리스폰까지 카운트다운 시간 (초) (기본값: 5) */
  countdownTime?: number;
  /** 컴포넌트 너비 (기본값: auto) */
  width?: number | string;
  /** 컴포넌트 높이 (기본값: auto) */
  height?: number | string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: React.CSSProperties;
}

/**
 * 리스폰 카운트다운 컴포넌트
 *
 * 플레이어 사망 시 카운트다운을 표시하고 시간이 끝나면 자동으로 부활 이벤트를 발생시킵니다.
 * @component
 */
const RespawnCountdown: React.FC<RespawnCountdownProps> = ({
  countdownTime = 10,
  width = 'auto',
  height = 'auto',
  className,
  style,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(countdownTime);

  // 카운트다운 시작 함수
  const startCountdown = useCallback(() => {
    setIsVisible(true);
    setTimeLeft(countdownTime);
  }, [countdownTime]);

  // 카운트다운 종료 함수 (부활 이벤트 발생)
  const respawnPlayer = useCallback(() => {
    setIsVisible(false);
    dispatchGameEvent(FPS_GAME_EVENTS.MY_PLAYER_REBIRTH_EVENT);
  }, []);

  // 죽음 이벤트 수신 핸들러
  const handleDieEvent = useCallback(() => {
    console.log('Player died, starting respawn countdown...');
    startCountdown();
  }, [startCountdown]);

  // 죽음 이벤트 리스너 등록
  useEffect(() => {
    GameEvents.addEventListener(
      FPS_GAME_EVENTS.YOU_DIE_AND_WAIT_EVENT,
      handleDieEvent
    );

    return () => {
      GameEvents.removeEventListener(
        FPS_GAME_EVENTS.YOU_DIE_AND_WAIT_EVENT,
        handleDieEvent
      );
    };
  }, [handleDieEvent]);

  // 카운트다운 타이머 효과
  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      }

      if (timeLeft === 1) {
        respawnPlayer();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, timeLeft, respawnPlayer]);

  // 컴포넌트가 보이지 않으면 렌더링하지 않음
  if (!isVisible) {
    return null;
  }

  // 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    border: '2px solid rgba(255, 0, 0, 0.3)',
    boxShadow: '0 4px 12px rgba(255, 0, 0, 0.2)',
    borderRadius: '12px',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center',
    width: width,
    height: height,
    ...style,
  };

  return (
    <div style={containerStyle} className={className}>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: '#ff4444',
          textShadow: '0 0 10px rgba(255, 68, 68, 0.7)',
        }}
      >
        YOU DIED
      </div>
      <div style={{ fontSize: '18px', marginBottom: '16px' }}>
        Respawning in...
      </div>
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ff4444',
          textShadow: '0 0 10px rgba(255, 68, 68, 0.7)',
          margin: '8px 0',
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
};

export default RespawnCountdown;
