import React from 'react';
import HealthBar from './components/HealthBar';
import PingDisplay from './components/PingDisplay';
import RespawnCountdown from './components/RespawnCountdown';
import ScoreBoard from './components/ScoreBoard';
import AmmoDisplay from './components/AmmoDisplay';
import WeaponDisplay from './components/WeaponDisplay';

/**
 * Main game UI component
 * Provides settings and controls for game configuration
 *
 * Features:
 * - Network status display (ping)
 * - HP monitoring through HealthBar component
 * - Respawn countdown when player dies
 *
 * @component
 */
export const GameUI = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* 게임 UI 컨테이너 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
        }}
      >
        {/* 플레이어 상태 정보 (좌측 하단) */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'auto',
          }}
        >
          <HealthBar />
        </div>

        {/* 무기 선택 정보 (오른쪽 세로 영역) */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
            pointerEvents: 'auto',
          }}
        >
          <WeaponDisplay />
        </div>

        {/* 탄약 정보 (우측 하단) */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-end',
            pointerEvents: 'auto',
          }}
        >
          <AmmoDisplay />
        </div>

        {/* 리스폰 카운트다운 (화면 중앙) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <RespawnCountdown />
        </div>

        {/* 스코어보드 (화면 중앙) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
          }}
        >
          <ScoreBoard />
        </div>
      </div>
    </div>
  );
};

export default GameUI;
