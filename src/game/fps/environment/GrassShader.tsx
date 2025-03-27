import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  InstancedMesh,
  Object3D,
  DynamicDrawUsage,
  MeshLambertMaterial,
  Color,
  CylinderGeometry,
} from 'three';

interface GrassShaderProps {
  terrainWidth: number;
  terrainDepth: number;
  terrainHeightFunc: (x: number, z: number) => number;
  density?: number;
  grassHeight?: number;
  color?: string;
  windStrength?: number;
}

export const GrassShader: React.FC<GrassShaderProps> = ({
  terrainWidth,
  terrainDepth,
  terrainHeightFunc,
  density = 0.005,
  grassHeight = 1.0,
  color = '#7cba4d',
  windStrength = 0.3,
}) => {
  const count = Math.floor(terrainWidth * terrainDepth * density);
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const time = useRef(0);

  // 풀 블레이드 위치 생성
  useMemo(() => {
    if (mesh.current) {
      mesh.current.instanceMatrix.setUsage(DynamicDrawUsage);
      console.log(
        `풀 개수: ${count}, 지형 크기: ${terrainWidth}x${terrainDepth}`
      );

      for (let i = 0; i < count; i++) {
        const xPos = (Math.random() - 0.5) * terrainWidth;
        const zPos = (Math.random() - 0.5) * terrainDepth;

        // 해당 위치의 높이 계산
        const y = terrainHeightFunc(xPos, zPos);

        if (i === 0) {
          console.log(`첫 번째 풀 위치: x=${xPos}, y=${y}, z=${zPos}`);
        }

        const scale = 0.5 + Math.random() * 0.5;
        const rotation = Math.random() * Math.PI * 2;

        // 위치 설정
        dummy.position.set(xPos, y + 0.5, zPos);
        dummy.rotation.set(0, rotation, 0);

        // 크기 설정 - 상단이 더 얇아지게
        dummy.scale.set(0.2, scale * grassHeight * 4.0, 0.2);
        dummy.updateMatrix();

        mesh.current.setMatrixAt(i, dummy.matrix);
      }

      mesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [
    terrainWidth,
    terrainDepth,
    terrainHeightFunc,
    count,
    grassHeight,
    dummy,
  ]);

  // 바람 애니메이션 개선
  useFrame((state) => {
    if (mesh.current) {
      time.current = state.clock.getElapsedTime();

      // 모든 풀 업데이트 (성능 최적화)
      for (let i = 0; i < Math.min(count, 200); i++) {
        mesh.current.getMatrixAt(i, dummy.matrix);

        // 위치 기반 바람 효과
        const windEffect = Math.sin(time.current * 2 + i * 0.1) * windStrength;

        // 바람에 따른 기울기 조정
        dummy.rotation.z = windEffect * 0.2;
        dummy.rotation.x = windEffect * 0.1;

        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }

      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[0.15, 0.3, 1, 4]} />
      <meshLambertMaterial color={new Color(color)} />
    </instancedMesh>
  );
};
