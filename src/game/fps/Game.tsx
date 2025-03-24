import { Suspense, useEffect } from 'react';
import { useGameServer } from '@agent8/gameserver';
import MainScene from '@/game/fps/scenes/MainScene';
import { preloadWeaponModels } from './preload/WeaponPreloader';

export const Game = () => {
  useGameServer();

  // 게임 초기화 시 무기 모델 사전 로딩
  useEffect(() => {
    preloadWeaponModels()
      .then(() => console.log('[FpsGame] 무기 모델 로드 완료'))
      .catch((error) => console.error('[FpsGame] 무기 모델 로드 실패:', error));
  }, []);

  return <Suspense fallback={null}>{<MainScene />}</Suspense>;
};
