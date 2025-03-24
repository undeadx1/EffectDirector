import { Vector3 } from 'three';
import { FPS_GAME_CONSTANTS } from '@/game/fps/constants/game.constants';

/**
 * 맵의 코너 위치 목록을 가져옵니다.
 * @returns {Vector3[]} 맵의 코너 위치 배열
 */
export const getCornerPositions = (): Vector3[] => {
  const startPosition = FPS_GAME_CONSTANTS.PLAYER_SETTINGS.DEFAULT_POSITION;

  return [
    new Vector3(startPosition.x, startPosition.y, startPosition.z), // 1
    new Vector3(startPosition.x * -1, startPosition.y, startPosition.z), // 2
    new Vector3(startPosition.x, startPosition.y, startPosition.z * -1), // 3
    new Vector3(startPosition.x * -1, startPosition.y, startPosition.z * -1), // 4
  ];
};

/**
 * 랜덤 코너 위치를 선택합니다.
 * @returns {Vector3} 선택된 랜덤 코너 위치
 */
export const getRandomCorner = (): Vector3 => {
  const corners = getCornerPositions();
  const randomIndex = Math.floor(Math.random() * corners.length);
  return corners[randomIndex];
};
