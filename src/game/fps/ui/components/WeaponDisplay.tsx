import React, { useEffect, useState } from 'react';
import { FPS_GAME_EVENTS } from '@/game/fps/constants/game.constants';
import {
  addGameEventListener,
  removeGameEventListener,
} from '@/game/fps/eventSystem/GameEvents';
import { GiRifle } from 'react-icons/gi';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';
import { getWeaponAttributes } from '@/game/fps/config/weapon.config';
import { WEAPON } from '@/game/fps/assets';

/**
 * WeaponDisplay 컴포넌트 Props
 * @interface WeaponDisplayProps
 */
interface WeaponDisplayProps {
  /** 컴포넌트 너비 (기본값: 120px) */
  width?: number | string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: React.CSSProperties;
}

// 무기 목록 구성
const WEAPONS = [
  { key: '1', type: WEAPON.AK47, name: 'AK-47' },
  { key: '2', type: WEAPON.AK48, name: 'AK-48' },
  { key: '3', type: WEAPON.AK49, name: 'AK-49' },
];

/**
 * 현재 선택된 무기 표시 컴포넌트
 *
 * 현재 선택된 무기와 그 속성 정보를 표시합니다.
 * @component
 */
const WeaponDisplay: React.FC<WeaponDisplayProps> = ({
  width = 120,
  className,
  style,
}) => {
  const { selectedWeapon } = useFpsGameStore();
  const [currentWeapon, setCurrentWeapon] = useState(selectedWeapon);

  // 무기 정보 계산
  const weaponAttributes = getWeaponAttributes(currentWeapon);
  const weaponName = weaponAttributes.displayName;

  // 무기 변경 이벤트 처리
  useEffect(() => {
    const handleWeaponChange = (event: CustomEvent) => {
      if (event.detail && event.detail.weaponType) {
        // 자신의 무기 변경일 경우만 UI 업데이트
        if (!event.detail.userId) {
          setCurrentWeapon(event.detail.weaponType);
        }
      }
    };

    // 이벤트 리스너 등록
    addGameEventListener(
      FPS_GAME_EVENTS.WEAPON_CHANGE_EVENT,
      handleWeaponChange as EventListener
    );

    return () => {
      // 이벤트 리스너 제거
      removeGameEventListener(
        FPS_GAME_EVENTS.WEAPON_CHANGE_EVENT,
        handleWeaponChange as EventListener
      );
    };
  }, []);

  // 공통 텍스트 그림자 (AmmoDisplay와 동일)
  const commonTextShadow =
    '0px 0px 3px rgba(0, 0, 0, 1), 0px 0px 3px rgba(0, 0, 0, 1)';

  // 메인 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    ...style,
  };

  // 무기 정보 스타일 (배경 제거)
  const weaponInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
    fontSize: '22px',
    fontWeight: 'bold',
    padding: '5px',
    width: width,
    textShadow: commonTextShadow,
  };

  // 무기 아이콘 스타일
  const weaponIconStyle: React.CSSProperties = {
    marginTop: '5px',
  };

  // 무기 속성 스타일 (배경 제거)
  const weaponStatsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
    fontSize: '16px',
    width: width,
    textShadow: commonTextShadow,
  };

  // 무기 속성 아이템 스타일
  const statItemStyle: React.CSSProperties = {
    marginTop: '3px',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '600',
    textShadow: commonTextShadow,
  };

  // 무기 선택 목록 스타일 (수직 배치)
  const weaponSelectContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: width,
  };

  // 무기 선택 버튼 스타일
  const weaponButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    backgroundColor: isSelected
      ? 'rgba(255, 165, 0, 0.8)'
      : 'rgba(0, 0, 0, 0.5)',
    border: isSelected
      ? '1px solid rgba(255, 255, 255, 0.8)'
      : '1px solid rgba(255, 255, 255, 0.3)',
    textShadow: commonTextShadow,
    fontWeight: isSelected ? 'bold' : 'normal',
    width: '100%',
  });

  // 키 표시 스타일
  const keyStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '3px',
    padding: '1px 6px',
    marginRight: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* 현재 무기 정보 */}
      <div style={weaponInfoStyle}>
        <span>{weaponName}</span>
        <GiRifle size={28} style={weaponIconStyle} />
      </div>

      {/* 무기 속성 정보 */}
      <div style={weaponStatsStyle}>
        <div style={statItemStyle}>
          <span>DMG: {weaponAttributes.damage}</span>
        </div>
        <div style={statItemStyle}>
          <span>RATE: {weaponAttributes.fireRate}/s</span>
        </div>
      </div>

      {/* 무기 선택 목록 - 수직 배치 */}
      <div style={weaponSelectContainerStyle}>
        {WEAPONS.map((weapon) => (
          <div
            key={weapon.type}
            style={weaponButtonStyle(currentWeapon === weapon.type)}
          >
            <span style={keyStyle}>{weapon.key}</span>
            <span>{weapon.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeaponDisplay;
