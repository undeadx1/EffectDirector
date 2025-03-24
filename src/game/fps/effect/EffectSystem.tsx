// EffectSystem.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import useEffectStore from '../store/useEffectStore';

// 성능 설정
const MAX_EFFECTS_PER_SCOPE = 30; // 각 스코프별 최대 이펙트 수
const CLEANUP_INTERVAL = 5000; // 5초마다 정리

interface EffectSystemProps {
  scopeId?: string;
  useLowQuality?: boolean; // 저사양 모드 지원
}

export const EffectSystem: React.FC<EffectSystemProps> = ({
  scopeId,
  useLowQuality = false,
}) => {
  // 정리 타이머 참조
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCleanupTimeRef = useRef<number>(0);

  // 이펙트 정리 함수
  const cleanupExpiredEffects = () => {
    const now = Date.now();
    const store = useEffectStore.getState();
    const effects = store.effects;

    // 만료된 이펙트 찾기
    const expiredEffects = effects.filter((effect) => {
      const createdAt = effect.createdAt || 0;
      const duration = effect.duration || 1000;
      return now - createdAt > duration * 2; // 2배 여유 시간
    });

    // 만료된 이펙트 정리
    if (expiredEffects.length > 0) {
      console.log(`[EffectSystem] ${expiredEffects.length}개 만료 이펙트 정리`);
      expiredEffects.forEach((effect) => {
        store.removeEffect(effect.id);
      });
    }

    // 스코프별 최대 이펙트 수 제한
    if (scopeId) {
      const scopeEffects = effects.filter(
        (effect) => effect.scopeId === scopeId
      );

      if (scopeEffects.length > MAX_EFFECTS_PER_SCOPE) {
        console.log(
          `[EffectSystem] ${scopeId} 스코프 이펙트 제한 초과 (${scopeEffects.length}/${MAX_EFFECTS_PER_SCOPE})`
        );

        // 가장 오래된 이펙트부터 제거
        const sortedEffects = [...scopeEffects].sort(
          (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
        );

        const excessCount = scopeEffects.length - MAX_EFFECTS_PER_SCOPE;
        for (let i = 0; i < excessCount; i++) {
          if (sortedEffects[i]) {
            store.removeEffect(sortedEffects[i].id);
          }
        }
      }
    }

    lastCleanupTimeRef.current = now;
  };

  // 정기적인 이펙트 정리 설정
  useEffect(() => {
    // 초기 정리 실행
    cleanupExpiredEffects();

    // 주기적 정리 타이머 설정
    cleanupTimerRef.current = setInterval(
      cleanupExpiredEffects,
      CLEANUP_INTERVAL
    );

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }

      // 해당 스코프의 모든 이펙트 제거
      if (scopeId) {
        const effectsToRemove = useEffectStore
          .getState()
          .effects.filter((effect) => effect.scopeId === scopeId);

        console.log(
          `[EffectSystem] ${scopeId} 스코프 이펙트 ${effectsToRemove.length}개 정리`
        );

        effectsToRemove.forEach((effect) =>
          useEffectStore.getState().removeEffect(effect.id)
        );
      }
    };
  }, [scopeId]);

  // useMemo를 사용하여 필터링된 효과 결과를 캐싱
  const effects = useMemo(() => {
    const filteredEffects = useEffectStore
      .getState()
      .effects.filter((effect) => !scopeId || effect.scopeId === scopeId);

    // 저사양 모드일 경우 최대 이펙트 수 더 제한
    if (useLowQuality && filteredEffects.length > MAX_EFFECTS_PER_SCOPE / 2) {
      return filteredEffects.slice(-MAX_EFFECTS_PER_SCOPE / 2);
    }

    return filteredEffects;
  }, [scopeId, useLowQuality, useEffectStore((state) => state.effects)]);

  // 메모리 사용량 로깅 (100개 이상 이펙트 발생 시)
  useEffect(() => {
    if (effects.length > 100) {
      console.warn(`[EffectSystem] 이펙트 수 과다: ${effects.length}개`);

      // 메모리 정보 기록 (Chrome 전용)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        console.warn(
          `[Memory] JS Heap: ${Math.round(memoryInfo.usedJSHeapSize / 1048576)}MB / ${Math.round(memoryInfo.jsHeapSizeLimit / 1048576)}MB`
        );
      }

      // 강제 정리 실행
      cleanupExpiredEffects();
    }
  }, [effects.length]);

  // 최적화된 렌더링
  return (
    <group name="effect-system">
      {effects.map((effect) => {
        const EffectComponent = effect.component;
        return (
          <EffectComponent
            key={effect.id}
            position={effect.position}
            rotation={effect.rotation}
            scale={effect.scale}
            normal={effect.normal}
            hitObject={effect.hitObject}
          />
        );
      })}
    </group>
  );
};

export default React.memo(EffectSystem);
