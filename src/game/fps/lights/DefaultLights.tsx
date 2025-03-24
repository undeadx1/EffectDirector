import { useRef } from 'react';
import { DirectionalLight } from 'three';

/**
 * Default lighting setup for the 3D scene
 * Includes a directional light for shadows and an ambient light for overall illumination
 *
 * @component
 * @example
 * ```tsx
 * <Canvas>
 *   <DefaultLights />
 *   <Scene />
 * </Canvas>
 * ```
 */
export const DefaultLights = () => {
  const directionalLightRef = useRef<DirectionalLight>(null);

  return (
    <>
      {/* Main directional light with shadow casting */}
      <directionalLight
        castShadow
        shadow-normalBias={0.06}
        position={[50, 100, 50]}
        intensity={3}
        shadow-mapSize={[8192, 8192]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-top={100}
        shadow-camera-right={100}
        shadow-camera-bottom={-100}
        shadow-camera-left={-100}
        ref={directionalLightRef}
      />
      {/* Ambient light for overall scene illumination */}
      <ambientLight intensity={1.2} />
    </>
  );
};
