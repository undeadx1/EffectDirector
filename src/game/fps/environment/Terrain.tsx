import { Suspense } from 'react';
import TerrainGenerator from './TerrainGenerator';

export const GameWorld = () => {
  return (
    <Suspense fallback={null}>
      <TerrainGenerator
        width={200}
        depth={200}
        maxHeight={20}
        seed="mountain-valley-12"
        roughness={0.7}
        detail={6}
        color="#5d8a68"
      />
    </Suspense>
  );
};
