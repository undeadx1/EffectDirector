import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Stars = () => {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    size: 0.1,
    transparent: true,
  });

  const starVertices = [];
  for (let i = 0; i < 2000; i++) {
    const x = THREE.MathUtils.randFloatSpread(500);
    const y = THREE.MathUtils.randFloatSpread(500);
    const z = THREE.MathUtils.randFloatSpread(500);
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starVertices, 3)
  );

  useFrame(() => {
    starMaterial.color.setHSL(Math.random(), 1, 0.5); // 랜덤 색상
  });

  return <points geometry={starGeometry} material={starMaterial} />;
};

export const Nebula = () => {
  // 그라데이션 텍스처 생성
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(128, 0, 128, 0.8)'); // 보라색
    gradient.addColorStop(0.15, 'rgba(114, 0, 139, 0.7)'); // 중간 보라색
    gradient.addColorStop(0.3, 'rgba(100, 0, 150, 0.6)'); // 중간 보라색
    gradient.addColorStop(0.4, 'rgba(50, 0, 200, 0.55)'); // 보라-파랑
    gradient.addColorStop(0.5, 'rgba(0, 0, 255, 0.5)'); // 파란색
    gradient.addColorStop(0.6, 'rgba(0, 25, 230, 0.4)'); // 중간 파란색
    gradient.addColorStop(0.7, 'rgba(0, 50, 200, 0.3)'); // 중간 파란색
    gradient.addColorStop(0.85, 'rgba(0, 25, 100, 0.15)'); // 파랑-투명
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // 투명

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  const gradientTexture = new THREE.CanvasTexture(canvas);

  return (
    <mesh position={[0, 0, -300]}>
      <planeGeometry args={[2048, 2048]} />
      <meshStandardMaterial
        map={gradientTexture}
        opacity={0.5}
        transparent={true}
      />
    </mesh>
  );
};
