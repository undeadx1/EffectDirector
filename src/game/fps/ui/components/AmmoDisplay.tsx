import React, { useEffect, useState, useRef } from 'react';
import { FPS_GAME_EVENTS } from '@/game/fps/constants/game.constants';
import {
  addGameEventListener,
  removeGameEventListener,
} from '@/game/fps/eventSystem/GameEvents';
import { GiHeavyBullets } from 'react-icons/gi';

/**
 * AmmoDisplay 컴포넌트 Props
 * @interface AmmoDisplayProps
 */
interface AmmoDisplayProps {
  /** 컴포넌트 너비 (기본값: 100px) */
  width?: number | string;
  /** 컴포넌트 높이 (기본값: auto) */
  height?: number | string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: React.CSSProperties;
}

/**
 * 탄약 표시 컴포넌트
 *
 * 현재 탄약 수와 최대 탄약 수를 표시합니다.
 * @component
 */
const AmmoDisplay: React.FC<AmmoDisplayProps> = ({
  width = 100,
  height = 'auto',
  className,
  style,
}) => {
  const [ammo, setAmmo] = useState({ current: 50, max: 50 });
  const [isLowAmmo, setIsLowAmmo] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);

  // 마지막으로 받은 진행률을 저장
  const lastProgressRef = useRef(0);

  // 탄약 업데이트 이벤트 처리
  useEffect(() => {
    const handleAmmoUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.current === 'number') {
        setAmmo({
          current: event.detail.current,
          max: event.detail.max || 50,
        });

        // 탄약이 30% 이하면 낮은 탄약 경고 활성화
        setIsLowAmmo(event.detail.current <= event.detail.max * 0.3);
      }
    };

    // 탄약 없음 이벤트 처리
    const handleAmmoEmpty = () => {
      // NO AMMO 표기를 제거하기 위해 이 핸들러의 내용을 비움
    };

    // 재장전 시작 이벤트 처리
    const handleReloadStart = () => {
      console.log('[AmmoDisplay] Reload start event received');
      setIsReloading(true);
      setReloadProgress(0);
      lastProgressRef.current = 0;
    };

    // 재장전 진행 이벤트 처리
    const handleReloadProgress = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.progress === 'number') {
        const progress = Math.max(0, Math.min(100, event.detail.progress));
        console.log('[AmmoDisplay] Reload progress event:', progress, '%');

        // 이전에 받은 값과 다를 때만 업데이트 (중복 방지)
        if (progress !== lastProgressRef.current) {
          lastProgressRef.current = progress;
          setReloadProgress(progress);
        }
      }
    };

    // 재장전 완료 이벤트 처리
    const handleReloadComplete = (event: CustomEvent) => {
      console.log('[AmmoDisplay] Reload complete event received');
      setIsReloading(false);
      setReloadProgress(0);
      lastProgressRef.current = 0;

      // 새로운 탄약 정보 업데이트
      if (event.detail && typeof event.detail.current === 'number') {
        setAmmo({
          current: event.detail.current,
          max: event.detail.max || 50,
        });
      }
    };

    console.log('[AmmoDisplay] Registering event listeners');

    // 이벤트 리스너 등록
    addGameEventListener(
      FPS_GAME_EVENTS.AMMO_UPDATE_EVENT,
      handleAmmoUpdate as EventListener
    );
    addGameEventListener(
      FPS_GAME_EVENTS.AMMO_EMPTY_EVENT,
      handleAmmoEmpty as EventListener
    );
    addGameEventListener(
      FPS_GAME_EVENTS.RELOAD_START_EVENT,
      handleReloadStart as EventListener
    );
    addGameEventListener(
      FPS_GAME_EVENTS.RELOAD_PROGRESS_EVENT,
      handleReloadProgress as EventListener
    );
    addGameEventListener(
      FPS_GAME_EVENTS.RELOAD_COMPLETE_EVENT,
      handleReloadComplete as EventListener
    );

    // 컴포넌트 마운트 확인
    console.log('[AmmoDisplay] Component mounted and listeners registered');

    return () => {
      console.log('[AmmoDisplay] Removing event listeners');

      // 이벤트 리스너 제거
      removeGameEventListener(
        FPS_GAME_EVENTS.AMMO_UPDATE_EVENT,
        handleAmmoUpdate as EventListener
      );
      removeGameEventListener(
        FPS_GAME_EVENTS.AMMO_EMPTY_EVENT,
        handleAmmoEmpty as EventListener
      );
      removeGameEventListener(
        FPS_GAME_EVENTS.RELOAD_START_EVENT,
        handleReloadStart as EventListener
      );
      removeGameEventListener(
        FPS_GAME_EVENTS.RELOAD_PROGRESS_EVENT,
        handleReloadProgress as EventListener
      );
      removeGameEventListener(
        FPS_GAME_EVENTS.RELOAD_COMPLETE_EVENT,
        handleReloadComplete as EventListener
      );
    };
  }, []);

  // 메인 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    ...style,
  };

  // 재장전 UI 컨테이너 스타일
  const reloadContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-45px',
    left: 0,
    right: 0,
    display: isReloading ? 'flex' : 'none',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
  };

  // 재장전 중 메시지 스타일
  const reloadingMessageStyle: React.CSSProperties = {
    color: '#ff4d4d',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    padding: '5px 10px',
    borderRadius: '3px',
    width: '100%',
    textAlign: 'center',
    textShadow: '0px 0px 3px rgba(0, 0, 0, 1), 0px 0px 3px rgba(0, 0, 0, 1)',
  };

  // 재장전 게이지 컨테이너 스타일
  const reloadBarContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '5px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '2px',
    overflow: 'hidden',
  };

  // 게이지 진행률 계산
  const progressWidth = `${reloadProgress}%`;

  // 재장전 게이지 진행 스타일
  const reloadBarProgressStyle: React.CSSProperties = {
    width: progressWidth,
    height: '100%',
    backgroundColor: 'white',
    borderRadius: '2px',
    transition: 'width 0.05s linear', // 더 부드러운 전환 효과
  };

  // 탄약 패널 스타일
  const ammoPanelStyle: React.CSSProperties = {
    width: width,
    height: height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0px 25px',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    borderRadius: '3px',
    border: '1px solid rgba(255, 255, 255, 0.0)',
  };

  // 탄약 카운터 스타일
  const ammoCounterStyle: React.CSSProperties = {
    fontSize: '25px',
    fontWeight: 'bold',
    color: isLowAmmo ? '#ff4d4d' : 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.3s ease',
    textShadow: '0px 0px 3px rgba(0, 0, 0, 1), 0px 0px 3px rgba(0, 0, 0, 1)',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* 재장전 UI (메시지 + 게이지) */}
      <div style={reloadContainerStyle}>
        <div style={reloadingMessageStyle}>RELOADING</div>
        <div style={reloadBarContainerStyle}>
          <div
            style={reloadBarProgressStyle}
            data-progress={reloadProgress} // 디버깅용 데이터 속성
          />
        </div>
      </div>

      {/* 탄약 패널 */}
      <div style={ammoPanelStyle}>
        <div style={ammoCounterStyle}>
          <GiHeavyBullets
            size={30}
            color={isLowAmmo ? '#ff4d4d' : 'white'}
            style={{
              marginRight: '15px',
              marginBottom: '5px',
              filter:
                'drop-shadow(0px 0px 1px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 1px rgba(0, 0, 0, 1))',
            }}
          />
          {/* 항상 탄약 숫자만 표시 - 가로 방향으로 정렬 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <span>{ammo.current}</span>
            <span style={{ margin: '0 5px' }}>/</span>
            <span>{ammo.max}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmmoDisplay;
