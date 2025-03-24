import { forwardRef, memo, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { Box3, Vector3, Group } from 'three';
import { MAPS } from '@/game/fps/assets/maps';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';

/** Props for the MeshMap component */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MeshMapProps {
  // Currently no required props
}

/**
 * 3D map component that loads and renders a GLTF model with physics
 * Automatically centers the map and sets up collision detection
 *
 * Features:
 * - Automatic model loading and centering
 * - Physics colliders for terrain interaction
 * - Shadow casting and receiving
 * - Optimized with memo and Suspense
 *
 * @component
 * @example
 * ```tsx
 * <Suspense fallback={null}>
 *   <MeshMap ref={mapRef} />
 * </Suspense>
 * ```
 */
export const MeshMap = memo(
  forwardRef<Group, MeshMapProps>((props, ref) => {
    // Load GLTF model with Suspense handling

    const { selectedMap } = useFpsGameStore();
    const { scene } = useGLTF(selectedMap);

    // Configure shadow settings for all meshes in the scene
    useEffect(() => {
      scene.traverse((child) => {
        if (child.isObject3D) {
          child.receiveShadow = true;
          child.castShadow = true;
        }
      });
    }, [scene]);

    // Calculate map center position for proper alignment
    const adjustedPosition = useMemo(() => {
      const boundingBox = new Box3().setFromObject(scene);
      const center = new Vector3();
      boundingBox.getCenter(center);

      return new Vector3(-center.x, -center.y, -center.z);
    }, [scene]);

    return (
      <group position={adjustedPosition}>
        {/* Physics body with trimesh collider for complex terrain */}
        <RigidBody
          type="fixed"
          colliders="trimesh"
          friction={1}
          restitution={0}
        >
          <primitive object={scene} ref={ref} />
        </RigidBody>
      </group>
    );
  })
);

MeshMap.displayName = 'MeshMap';

// Preload model to optimize initial loading
useGLTF.preload(MAPS.SHOOTER_ARENA);

export default MeshMap;
