import { WEAPON } from '@/game/fps/assets';

/**
 * 무기 속성 인터페이스 정의
 */
export interface WeaponAttributes {
  maxAmmo: number; // 최대 탄약 수
  damage: number; // 공격력
  fireRate: number; // 연사 속도 (1초당 발사 횟수)
  reloadTime: number; // 재장전 시간 (밀리초)
  fireInterval: number; // 발사 간격 (밀리초)
  displayName: string; // 표시 이름
}

/**
 * 무기별 속성 정보
 */
export const WEAPON_ATTRIBUTES: Record<string, WeaponAttributes> = {
  [WEAPON.AK47]: {
    maxAmmo: 30,
    damage: 10,
    fireRate: 7,
    reloadTime: 2000,
    fireInterval: 150,
    displayName: 'AK-47',
  },
  [WEAPON.AK48]: {
    maxAmmo: 10,
    damage: 25,
    fireRate: 5,
    reloadTime: 1800,
    fireInterval: 500,
    displayName: 'AK-48',
  },
  [WEAPON.AK49]: {
    maxAmmo: 100,
    damage: 2,
    fireRate: 10,
    reloadTime: 3000,
    fireInterval: 100,
    displayName: 'AK-49',
  },
};

/**
 * 무기 속성 가져오기
 * @param weaponType 무기 유형 경로
 * @returns 무기 속성 정보
 */
export function getWeaponAttributes(weaponType: string): WeaponAttributes {
  return WEAPON_ATTRIBUTES[weaponType] || WEAPON_ATTRIBUTES[WEAPON.AK47];
}
