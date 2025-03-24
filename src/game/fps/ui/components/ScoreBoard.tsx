import React, { useEffect, useState } from 'react';
import { useFpsNetworkStore } from '@/game/fps/store/fpsNetworkStore';
import { useGameServer } from '@agent8/gameserver';
import { FPS_GAME_EVENTS } from '@/game/fps/constants/game.constants';
import {
  addGameEventListener,
  removeGameEventListener,
} from '@/game/fps/eventSystem/GameEvents';

/**
 * ScoreBoard 컴포넌트 Props
 * @interface ScoreBoardProps
 */
interface ScoreBoardProps {
  /** 컴포넌트 너비 (기본값: 400px) */
  width?: number | string;
  /** 컴포넌트 높이 (기본값: auto) */
  height?: number | string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: React.CSSProperties;
}

/**
 * 스코어보드 컴포넌트
 *
 * 탭 키를 누르면 표시되는 플레이어 점수판입니다.
 * 모든 플레이어의 이름과 점수를 표시합니다.
 * @component
 */
const ScoreBoard: React.FC<ScoreBoardProps> = ({
  width = 400,
  height = 'auto',
  className,
  style,
}) => {
  const { roomUsersState } = useFpsNetworkStore();
  const { account } = useGameServer();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [players, setPlayers] = useState<
    {
      name: string;
      score: number;
      isCurrentPlayer: boolean;
      userId: string;
    }[]
  >([]);

  // 스코어보드 토글 이벤트 처리
  useEffect(() => {
    const handleToggleScoreBoard = (event: CustomEvent) => {
      // event.detail에서 visible 값을 가져옴
      if (event.detail && typeof event.detail.visible === 'boolean') {
        setIsVisible(event.detail.visible);
      }
    };

    // 이벤트 리스너 등록
    addGameEventListener(
      FPS_GAME_EVENTS.TOGGLE_SCOREBOARD_EVENT,
      handleToggleScoreBoard
    );

    return () => {
      removeGameEventListener(
        FPS_GAME_EVENTS.TOGGLE_SCOREBOARD_EVENT,
        handleToggleScoreBoard
      );
    };
  }, []);

  // roomUsersState가 변경될 때마다 플레이어 정보 업데이트
  useEffect(() => {
    if (!roomUsersState) return;

    const playersList = Object.entries(roomUsersState).map(
      ([userId, userState]) => {
        return {
          userId,
          name: userState.playerState?.profile?.username || 'Unknown Player',
          score: userState.characterState?.score || 0,
          isCurrentPlayer: userId === account,
        };
      }
    );

    // 점수 내림차순으로 정렬
    playersList.sort((a, b) => b.score - a.score);

    setPlayers(playersList);
  }, [roomUsersState, account]);

  // 컴포넌트가 보이지 않으면 렌더링하지 않음
  if (!isVisible) {
    return null;
  }

  // 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    borderRadius: '8px',
    padding: '16px',
    width: width,
    height: height,
    color: 'white',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'auto', // 마우스 이벤트가 작동하도록 설정
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textAlign: 'center',
    color: '#fff',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
    width: '100%',
    padding: '0 0 8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeaderStyle: React.CSSProperties = {
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '8px 16px',
    color: '#aaa',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={headerStyle}>Score Board</div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...tableHeaderStyle, width: '10%' }}>#</th>
            <th style={{ ...tableHeaderStyle, width: '60%' }}>Player</th>
            <th
              style={{ ...tableHeaderStyle, width: '30%', textAlign: 'right' }}
            >
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {players.length > 0 ? (
            players.map((player, index) => (
              <tr
                key={player.userId}
                style={{
                  backgroundColor: player.isCurrentPlayer
                    ? 'rgba(30, 144, 255, 0.2)'
                    : index % 2 === 0
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'transparent',
                }}
              >
                <td
                  style={{
                    padding: '8px 16px',
                    color: player.isCurrentPlayer ? '#3498db' : '#fff',
                    fontWeight: player.isCurrentPlayer ? 'bold' : 'normal',
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    padding: '8px 16px',
                    color: player.isCurrentPlayer ? '#3498db' : '#fff',
                    fontWeight: player.isCurrentPlayer ? 'bold' : 'normal',
                  }}
                >
                  {player.name} {player.isCurrentPlayer ? '(You)' : ''}
                </td>
                <td
                  style={{
                    padding: '8px 16px',
                    textAlign: 'right',
                    color: player.isCurrentPlayer ? '#3498db' : '#fff',
                    fontWeight: player.isCurrentPlayer ? 'bold' : 'normal',
                  }}
                >
                  {player.score}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ padding: '16px', textAlign: 'center' }}>
                No players found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreBoard;
