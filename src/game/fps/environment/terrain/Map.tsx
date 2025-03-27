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
        grassDensity={0.1}
        grassHeight={1.2}
        grassColor="#4a7c2a"
        windStrength={0.2}
        grassTexturePath="/textures/grass_blade_diffuse.png"
      />
    </Suspense>
  );
};
