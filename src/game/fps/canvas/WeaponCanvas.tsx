import React from 'react';
import FixedPlayerRender from '@/game/fps/entity/player/FixedPlayerRender';
import { Canvas } from '@react-three/fiber';
import { DefaultLights } from '@/game/fps/lights/DefaultLights';
import Crosshair from '@/game/fps/ui/CrossHair';
import DamageOverlay from '@/game/fps/entity/player/DamageOverlay';
import { EffectSystem } from '@/game/fps/effect/EffectSystem';

const WeaponCanvas: React.FC = () => {
  return (
    <>
      <Canvas
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // 모든 마우스 이벤트를 통과시킴
        }}
      >
        <DefaultLights />
        <FixedPlayerRender isHeadless={true} />
        <EffectSystem scopeId="weapon" />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <DamageOverlay />
        <Crosshair />
      </div>
    </>
  );
};

export default WeaponCanvas;
