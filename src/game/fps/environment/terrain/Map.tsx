import { Suspense } from 'react';
import Terrain from './Terrain';

export const Map = () => {
  return (
    <Suspense fallback={null}>
      <Terrain
        width={256}
        depth={256}
        maxHeight={20}
        seed="mountain-valley-12"
        roughness={0.7}
        detail={6}
        color="#5d8a68"
        enableGrass={true}
        grassDensity={20}
        clusterFactor={2}
        grassHeight={2}
        grassColor="#669944"
        windStrength={0.3}
        grassTexturePath="/textures/grass_blade_diffuse.png"
      />
    </Suspense>
  );
};
