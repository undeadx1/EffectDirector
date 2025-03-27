import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GrassShaderProps {
  terrainWidth: number;
  terrainDepth: number;
  terrainHeightFunc: (x: number, z: number) => number;
}

export const GrassShader: React.FC<GrassShaderProps> = ({
  terrainWidth,
  terrainDepth,
  terrainHeightFunc,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const count = 50000; // 풀 개수 증가
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 더 큰 풀 지오메트리 생성
  const grassGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.2, 1.0, 1, 4); // 높이 두 배로

    // 풀잎 모양 조정 (위로 갈수록 좁아지게)
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0) {
        pos.setX(i, pos.getX(i) * (1 - y * 0.7)); // 더 뾰족하게
      }
    }

    geo.computeVertexNormals();
    geo.translate(0, 0.5, 0); // 중심을 더 위로
    return geo;
  }, []);

  // 풀 배치
  useMemo(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      // 랜덤 위치 생성
      const x = (Math.random() - 0.5) * terrainWidth;
      const z = (Math.random() - 0.5) * terrainDepth;

      try {
        // 지형 높이 계산
        const y = terrainHeightFunc(x, z);

        // 랜덤 회전 및 스케일
        const angle = Math.random() * Math.PI * 2;
        const scale = 0.8 + Math.random() * 0.7; // 더 큰 스케일

        dummy.position.set(x, y + 0.1, z); // 약간 더 위로
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(scale, scale * 1.2, scale); // y축 더 크게
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(i, dummy.matrix);
      } catch (e) {
        console.error('풀 위치 계산 오류:', e);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [terrainWidth, terrainDepth, terrainHeightFunc, dummy, count]);

  // 개선된 바람 효과 쉐이더
  const vertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying float vHeight;
    
    void main() {
      vUv = uv;
      vHeight = position.y;
      
      // instanceMatrix에서 위치 정보 추출
      vec4 mvPosition = instanceMatrix * vec4(position, 1.0);
      
      // 바람 효과 계산 - 더 강하게
      float windStrength = 0.15;
      float windFreq = 1.5;
      float windOffset = mvPosition.x * 0.1 + mvPosition.z * 0.1;
      
      // 높이에 따른 바람 효과 (위쪽만 움직임)
      if(position.y > 0.1) {
        float wind = sin(time * windFreq + windOffset) * windStrength * position.y;
        wind += cos(time * windFreq * 0.7 + windOffset * 1.3) * windStrength * 0.5 * position.y;
        mvPosition.x += wind;
        mvPosition.z += wind * 0.6;
      }
      
      gl_Position = projectionMatrix * viewMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 grassColor;
    varying vec2 vUv;
    varying float vHeight;
    
    void main() {
      // 더 선명한 색상으로 변경
      vec3 topColor = vec3(0.3, 1.0, 0.2); // 더 밝은 녹색
      vec3 bottomColor = vec3(0.05, 0.4, 0.05); // 더 어두운 녹색
      vec3 color = mix(bottomColor, topColor, vHeight * 2.0);
      
      // 가장자리 표현 (가운데는 밝게, 가장자리는 어둡게)
      float edge = 1.0 - 2.0 * abs(vUv.x - 0.5);
      edge = pow(edge, 0.4); // 더 선명한 가장자리
      
      color *= mix(0.6, 1.2, edge);
      
      // 알파 처리 (가장자리는 투명하게)
      float alpha = smoothstep(0.0, 0.05, edge);
      
      // 선명도 향상
      color = pow(color, vec3(0.8)); // 감마 조정으로 더 선명하게
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      grassColor: { value: new THREE.Color(0x4cff00) },
    }),
    []
  );

  // 애니메이션
  useFrame((state) => {
    time.current = state.clock.elapsedTime;
    if (meshRef.current && meshRef.current.material) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.time.value =
        time.current;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[grassGeometry, undefined, count]}
      frustumCulled={false}
      renderOrder={2} // 다른 객체보다 나중에 렌더링
    >
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
        alphaTest={0.05} // 알파 테스트 추가
      />
    </instancedMesh>
  );
};
