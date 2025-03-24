import React, { useEffect, useState } from 'react';
import GameCanvas from '@/game/fps/canvas/GameCanvas';
import { GameUI } from '@/game/fps/ui/GameUI';

const MainScene: React.FC = () => {
  const [pausedPhysics, setPausedPhysics] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'black',
      }}
    >
      {/* 메인 게임 캔버스 - 이벤트 수신 가능 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'all', // 이벤트를 받을 수 있도록 설정
        }}
      >
        <GameCanvas physics={false} pausedPhysics={pausedPhysics} />
      </div>

      {/* 게임 UI - 일반 React DOM 요소로 렌더링됨 */}
      <GameUI />
    </div>
  );
};

export default MainScene;
