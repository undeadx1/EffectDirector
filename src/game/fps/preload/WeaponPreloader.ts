import { useGLTF } from '@react-three/drei';
import { WEAPON } from '@/game/fps/assets';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';

// 무기 모델 캐시를 전역적으로 관리
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const weaponModelsCache = new Map<string, any>();
let isPreloaded = false;

/**
 * 무기 모델 사전 로딩 함수
 * 게임 시작 시 모든 무기 모델을 미리 로드하여 무기 전환 시 지연 현상을 방지
 */
export const preloadWeaponModels = (): Promise<void> => {
  // 이미 프리로드 되었으면 바로 완료
  if (isPreloaded) {
    console.log('[WeaponPreloader] 이미 무기 모델이 로드되었습니다.');
    return Promise.resolve();
  }

  console.log('[WeaponPreloader] 무기 모델 사전 로딩 시작...');

  // drei의 useGLTF.preload를 사용하여 모든 무기 모델 로드
  const weaponPaths = Object.values(WEAPON);
  weaponPaths.forEach((weaponPath) => {
    useGLTF.preload(weaponPath);
  });

  // Three.js LoadingManager를 사용한 세부 로딩 제어
  return new Promise<void>((resolve) => {
    const manager = new LoadingManager();
    const loader = new GLTFLoader(manager);
    const totalWeapons = weaponPaths.length;
    let loadedWeapons = 0;

    // 로딩 진행 상태 관리
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(
        `[WeaponPreloader] 로딩 진행 중: ${url} (${itemsLoaded}/${itemsTotal})`
      );
    };

    // 로딩 완료 처리
    manager.onLoad = () => {
      console.log('[WeaponPreloader] 모든 무기 모델 로딩 완료!');
      isPreloaded = true;
      resolve();
    };

    // 로딩 오류 처리
    manager.onError = (url) => {
      console.error(`[WeaponPreloader] 모델 로딩 실패: ${url}`);
      // 오류가 발생해도 게임을 계속 진행하기 위해 resolve 호출
      // 다른 무기는 정상적으로 로드되었을 수 있음
      if (++loadedWeapons >= totalWeapons) {
        isPreloaded = true;
        resolve();
      }
    };

    // 각 무기 모델 로드
    weaponPaths.forEach((weaponPath) => {
      // 각 무기 모델마다 5초 타임아웃 설정
      const timeoutId = setTimeout(() => {
        console.warn(`[WeaponPreloader] 로딩 타임아웃: ${weaponPath}`);
        if (++loadedWeapons >= totalWeapons) {
          isPreloaded = true;
          resolve();
        }
      }, 5000);

      loader.load(
        weaponPath,
        (gltf) => {
          clearTimeout(timeoutId);
          // 모델을 캐시에 저장
          weaponModelsCache.set(weaponPath, gltf);

          console.log(`[WeaponPreloader] 모델 로드 완료: ${weaponPath}`);

          if (++loadedWeapons >= totalWeapons) {
            isPreloaded = true;
            resolve();
          }
        },
        undefined,
        (error) => {
          clearTimeout(timeoutId);
          console.error(
            `[WeaponPreloader] 모델 로딩 오류: ${weaponPath}`,
            error
          );

          if (++loadedWeapons >= totalWeapons) {
            isPreloaded = true;
            resolve();
          }
        }
      );
    });
  });
};

/**
 * 캐시된 무기 모델 가져오기
 * @param weaponPath 무기 모델 경로
 */
export const getCachedWeaponModel = (weaponPath: string) => {
  return weaponModelsCache.get(weaponPath);
};

/**
 * 무기 모델 로드 상태 확인
 */
export const isWeaponModelsPreloaded = () => {
  return isPreloaded;
};

// 무기 모델 초기 로드 - drei 메서드 사용
Object.values(WEAPON).forEach((weaponPath) => {
  useGLTF.preload(weaponPath);
});
