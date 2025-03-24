import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GiHealingShield } from 'react-icons/gi';
import { IoSkullOutline } from 'react-icons/io5';
import { useFpsNetworkStore } from '../../store/fpsNetworkStore';
import { useGameServer } from '@agent8/gameserver';

/**
 * HealthBar 컴포넌트 Props
 * @interface HealthBarProps
 */
interface HealthBarProps {
  /** 컴포넌트 너비 (기본값: 240px) */
  width?: number | string;
  /** 컴포넌트 높이 (기본값: auto) */
  height?: number | string;
  /** 텍스트 표시 여부 (기본값: true) */
  showText?: boolean;
  /** 아이콘 표시 여부 (기본값: true) */
  showIcon?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: React.CSSProperties;
}

/**
 * 플레이어 체력 표시 컴포넌트
 *
 * HP 값에 따라 색상과 아이콘이 변화함
 * @component
 */
const HealthBar: React.FC<HealthBarProps> = ({
  width = 240,
  height = 'auto',
  showText = true,
  showIcon = true,
  className,
  style,
}) => {
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [maxHp, setMaxHp] = useState<number>(100);
  const prevHpRef = useRef<number | null>(null);
  const { account } = useGameServer();

  // HP 비율에 따른 색상 결정
  const getHpColor = () => {
    const hpPercent = (playerHp / maxHp) * 100;
    if (hpPercent <= 25) return '#ef4444'; // red-500 (위험)
    if (hpPercent <= 50) return '#fb923c'; // orange-400 (주의)
    return '#22c55e'; // green-500 (안전)
  };

  // ======== HP 변화 처리 함수들 ========

  /**
   * 데미지 처리 함수
   * @param currentHp 현재 HP
   * @param prevHp 이전 HP
   */
  const handleDamage = useCallback(
    (currentHp: number, prevHp: number) => {
      const hpDiff = prevHp - currentHp;
      console.log(
        account,
        `] - UI HP : ${prevHp} -> ${currentHp} (damage: ${hpDiff})`
      );
      setPlayerHp(currentHp);
      // TODO: 여기에 데미지 이펙트, 사운드 등 추가 가능
    },
    [account]
  );

  /**
   * 부활 처리 함수
   * @param currentHp 현재 HP
   * @param prevHp 이전 HP
   */
  const handleRebirth = useCallback(
    (currentHp: number, prevHp: number) => {
      console.log(account, `] - UI Rebirth: HP ${prevHp} -> ${currentHp}`);
      setPlayerHp(currentHp);
      // TODO: 여기에 부활 이펙트, 사운드 등 추가 가능
    },
    [account]
  );

  /**
   * HP 변화 감지 및 처리 함수
   * @param currentHp 현재 HP
   * @param prevHp 이전 HP
   */
  const handleHpChange = useCallback(
    (currentHp: number, prevHp: number) => {
      // HP가 감소한 경우 (데미지)
      if (currentHp < prevHp) {
        handleDamage(currentHp, prevHp);
      }
      // HP가 0 이하였다가 다시 양수가 된 경우 (부활)
      else if (prevHp <= 0 && currentHp > 0) {
        handleRebirth(currentHp, prevHp);
      }
      // 기타 HP 변화 (회복 등)
      else if (currentHp > prevHp) {
        console.log(account, `] - UI HP Restored: ${prevHp} -> ${currentHp}`);
        setPlayerHp(currentHp);
      }
    },
    [account, handleDamage, handleRebirth]
  );

  // ======== HP 모니터링 ========
  useEffect(() => {
    if (!account) return;

    const unsubscribe = useFpsNetworkStore.subscribe((state) => {
      const currentHp =
        state.roomUsersState[account]?.characterState?.currentHp;
      const maxPlayerHp =
        state.roomUsersState[account]?.playerState?.stats?.maxHp || 100;
      const prevHp = prevHpRef.current;

      // 최대 HP 업데이트
      if (maxPlayerHp !== maxHp) {
        setMaxHp(maxPlayerHp);
      }

      // 초기 HP 설정
      if (prevHp === null && currentHp !== undefined) {
        setPlayerHp(currentHp);
      }

      // HP 변화 감지 및 처리
      if (prevHp !== null && currentHp !== undefined) {
        handleHpChange(currentHp, prevHp);
      }

      // 현재 HP 저장
      prevHpRef.current = currentHp;
    });

    return () => unsubscribe();
  }, [account, handleHpChange, maxHp]);

  // 기본 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '12px 18px',
    width: width,
    height: height,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    ...style,
  };

  return (
    <div style={containerStyle} className={className}>
      {showIcon &&
        (playerHp <= 0 ? (
          <IoSkullOutline
            size={29}
            color="#ef4444"
            style={{ filter: 'drop-shadow(0 0 5px #ef4444)' }}
          />
        ) : (
          <GiHealingShield
            size={29}
            color={getHpColor()}
            style={{ filter: `drop-shadow(0 0 5px ${getHpColor()})` }}
          />
        ))}
      <div style={{ flex: 1 }}>
        <div
          style={{
            width: '100%',
            height: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '5px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(0, (playerHp / maxHp) * 100)}%`,
              height: '100%',
              backgroundColor: getHpColor(),
              boxShadow: `0 0 8px ${getHpColor()}`,
              transition: 'width 0.3s ease-in-out',
            }}
          ></div>
        </div>
        {showText && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '5px',
            }}
          >
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
              {'HP'}
            </span>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
              {playerHp} / {maxHp}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthBar;
