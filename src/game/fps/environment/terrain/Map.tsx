import { Suspense, useState } from 'react';
import { Vector3 } from 'three';
import Terrain from './Terrain';
import { GrassShader } from '../GrassShader';

export const Map = () => {
  const [terrainData, setTerrainData] = useState<{
    heightFunc: (x: number, z: number) => number;
    adjustedPosition: Vector3;
  } | null>(null);

  const terrainWidth = 256;
  const terrainDepth = 256;

  return (
    <Suspense fallback={null}>
      <Terrain
        width={terrainWidth}
        depth={terrainDepth}
        maxHeight={20}
        seed="mountain-valley-12"
        roughness={0.7}
        detail={6}
        color="#5d8a68"
        onHeightMapReady={(heightFunc, adjustedPosition) =>
          setTerrainData({ heightFunc, adjustedPosition })
        }
      />

      {terrainData && (
        <GrassShader
          terrainWidth={terrainWidth}
          terrainDepth={terrainDepth}
          terrainHeightFunc={terrainData.heightFunc}
          grassDensity={20}
          clusterFactor={10}
          grassHeight={2.5}
          grassColor="#779933"
          windStrength={0.5}
          yOffset={20}
        />
      )}
    </Suspense>
  );
};
