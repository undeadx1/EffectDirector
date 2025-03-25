import React, { useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  NormalBlending,
  Color,
  Euler,
  Vector3,
  Quaternion,
  DoubleSide,
  TextureLoader,
  Object3D,
  RepeatWrapping,
  Vector2,
} from 'three';
import * as THREE from 'three';
import { SpriteSheetEffect } from '@/game/fps/effect/SpriteSheetEffect';
import { ShaderEffect } from '@/game/fps/effect/ShaderEffect';
import { useFrame } from '@react-three/fiber';
import { calculateSurfaceRotation } from './EffectUtils';

export const MuzzleFlashEffect: React.FC<{ position: Vector3 }> = ({
  position,
}) => {
  // Generate a random Z-axis rotation between 0 and 2π
  const randomRotation = useMemo(() => {
    return new Euler(0, 0, Math.random() * Math.PI * 2);
  }, []);

  return (
    <SpriteSheetEffect
      position={position}
      rotation={randomRotation}
      texturePath="/textures/effects/muzzle.png"
      framesPerRow={1}
      framesPerColumn={1}
      duration={100}
      scale={1}
      color={new Color(1, 1, 1)}
      blending={AdditiveBlending}
      fadeOut
      scaleAnimation={{ start: 2, mid: 0.75, end: 0 }}
      opacityAnimation={{ start: 1, mid: 1, end: 1 }}
    />
  );
};

export const BulletHole: React.FC<{
  position: Vector3;
  normal?: Vector3;
}> = ({ position, normal }) => {
  // 랜덤 회전 생성 (z축)
  const randomRotation = useMemo(() => {
    return new Euler(0, 0, Math.random() * Math.PI * 2);
  }, []);

  // normal 벡터를 기반으로 회전 계산
  const surfaceRotation = useMemo(() => {
    return calculateSurfaceRotation(position, normal, randomRotation);
  }, [normal, randomRotation, position]);

  // z-fighting 방지용 position 조정
  const adjustedPosition = useMemo(() => {
    if (normal) {
      // normal 방향으로 약간 이동 (0.01 단위)
      return new Vector3().copy(position).addScaledVector(normal, 0.01);
    }
    return new Vector3().copy(position).add(new Vector3(0, 0, 0.01));
  }, [position, normal]);

  return (
    <SpriteSheetEffect
      position={adjustedPosition}
      rotation={surfaceRotation}
      texturePath="/textures/effects/bullethole.png"
      framesPerRow={1}
      framesPerColumn={1}
      duration={5000}
      scale={0.1}
      color={new Color(0.5, 0.5, 0.5)}
      blending={NormalBlending}
      depthWrite={false}
      polygonOffset={true}
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
      fadeOut
      disableBillboard={true}
      opacityAnimation={{ start: 1, mid: 1, end: 0 }}
    />
  );
};

// 텍스처 기반 레이저 빔 컴포넌트 (단순화 버전)
export const TexturedLaserBeam: React.FC<{
  position: Vector3;
  hitObject?: Object3D;
}> = ({ position, hitObject }) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // hitObject에서 레이저 속성 추출
  const laserProps = hitObject as unknown as {
    end?: Vector3;
    width?: number;
    texturePath?: string;
    color?: string;
    flowSpeed?: number;
  };

  // 속성 추출 및 기본값 설정
  const targetEnd =
    laserProps?.end || new Vector3(position.x, position.y, position.z + 10);
  const width = laserProps?.width || 0.02;
  const texturePath =
    laserProps?.texturePath || '/textures/effects/shootlaser.png';
  const color = laserProps?.color || '#ffffff';

  // 시작점에서 끝점까지의 거리와 방향 계산
  const direction = targetEnd.clone().sub(position);
  const distance = direction.length();

  // 실린더의 중심점 (시작점과 끝점의 중간)
  const center = position.clone().add(targetEnd).multiplyScalar(0.5);

  // 방향 벡터 정규화
  const normalizedDirection = direction.clone().normalize();

  // 실린더의 방향을 설정하기 위한 쿼터니언
  const beamQuaternion = useMemo(() => {
    // 기본 실린더는 Y축 방향으로 생성되므로, Y축에서 방향 벡터로의 회전 필요
    const cylinderDirection = new Vector3(0, 1, 0);
    return new Quaternion().setFromUnitVectors(
      cylinderDirection,
      normalizedDirection
    );
  }, [normalizedDirection]);

  // 끝 부분이 페이드 아웃 되는 그라데이션 텍스처 생성
  const gradientTexture = useMemo(() => {
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 가로 방향 그라데이션 생성 (중앙에서 가장자리로)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    // 왼쪽 가장자리 (투명)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    // 왼쪽 중간
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    // 중앙 (완전 불투명)
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
    // 오른쪽 중간
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    // 오른쪽 가장자리 (투명)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    // 그라데이션 적용
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 텍스처 생성
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    return texture;
  }, []);

  // 원본 텍스처 로드
  const originalTexture = useMemo(() => {
    const texture = new TextureLoader().load(texturePath);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1, Math.ceil(distance / 2));
    return texture;
  }, [texturePath, distance]);

  // 플로우 효과를 위한 타임 오프셋 계산 (선택 사항)
  const [offset, setOffset] = useState(0);
  const flowSpeed = laserProps?.flowSpeed || 0.5;

  useFrame((_, delta) => {
    // 시간에 따라 텍스처 오프셋 업데이트
    setOffset((prev) => (prev + delta * flowSpeed) % 1);

    if (originalTexture) {
      originalTexture.offset.y = offset;
    }
  });

  return (
    <group position={center} quaternion={beamQuaternion}>
      {/* 실린더 대신 빌보드 형태의 두 개의 직교하는 평면 사용 */}
      {/* 첫 번째 평면 */}
      <mesh>
        <planeGeometry args={[width * 2, distance]} />
        <meshBasicMaterial
          ref={materialRef}
          map={originalTexture}
          transparent={true}
          depthWrite={false}
          blending={NormalBlending}
          color={color}
          side={DoubleSide}
          alphaMap={gradientTexture}
        />
      </mesh>
      {/* 두 번째 평면 (90도 회전) */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[width * 2, distance]} />
        <meshBasicMaterial
          map={originalTexture}
          transparent={true}
          depthWrite={false}
          blending={NormalBlending}
          color={color}
          side={DoubleSide}
          alphaMap={gradientTexture}
        />
      </mesh>
    </group>
  );
};

export const SparkEffect: React.FC<{ position: Vector3 }> = ({ position }) => {
  // Generate a random Z-axis rotation between 0 and 2π
  const randomRotation = useMemo(() => {
    return new Euler(0, 0, Math.random() * Math.PI * 2);
  }, []);

  return (
    <SpriteSheetEffect
      position={position}
      rotation={randomRotation}
      texturePath="/textures/effects/spark.png"
      framesPerColumn={1}
      framesPerRow={1}
      duration={200}
      scale={1}
      color={new Color(1, 1, 1)}
      fadeOut
      depthTest={false}
      polygonOffset={true}
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
      blending={AdditiveBlending}
      scaleAnimation={{ start: 1, mid: 0, end: 0 }}
      opacityAnimation={{ start: 1, mid: 0, end: 0 }}
    />
  );
};

export const FireEffect: React.FC<{
  position: Vector3;
  scale?: Vector3;
  normal?: Vector3;
  disableBillboard?: boolean;
  volume?: boolean;
}> = ({ position, scale, normal, disableBillboard = false, volume = true }) => {
  // 불 효과를 위한 커스텀 프래그먼트 셰이더
  const fireFragmentShader = /* glsl */ ` 
    uniform vec2 resolution;
    uniform float time;
    uniform float opacity;
    varying vec2 vUv;

    float customSnoise(vec3 uv, float res)
    {
        const vec3 s = vec3(1e0, 1e2, 1e3);
        
        uv *= res;
        
        vec3 uv0 = floor(mod(uv, res))*s;
        vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;
        
        vec3 f = fract(uv); f = f*f*(3.0-2.0*f); 

        vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
                      uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

        vec4 r = fract(sin(v*1e-1)*1e3);
        float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
        
        r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
        float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
        
        return mix(r0, r1, f.z)*2.-1.; 
    }

    void main() 
    { 
        // 중심을 향하도록 좌표 조정 (0.5, 0.5가 중심) 
        vec2 p = vUv - 0.5;
       
        // 거리 계산 - 원형 마스크용
        float dist = length(p);
             
        // 효과 크기를 더 작게 조정 (숫자를 키워서 효과 크기를 줄임)
        float color = 3.0 - (3.*length(3.0*p));
        
        vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);
        
        // 시간에 따른 움직임 추가
        float t = time * 2.0; // 시간 속도 조절 
        coord += vec3(0., -t * 0.05, t * 0.01);
        
        for(int i = 1; i <= 7; i++)
        {
            float power = pow(2.0, float(i));
            color += (1.5 / power) * customSnoise(coord, power*16.);
        }

        // 불 효과를 위한 색상 조정
        vec3 fireColor = vec3(
            color * 1.8,                    // R
            pow(max(color,0.),2.)*0.4,      // G
            pow(max(color,0.),3.)*0.15      // B
        );
        
        // 하드 컷오프 - 불 효과의 경계를 명확하게
        float alpha = 1.0;
        
        // 색상값이 임계값보다 낮으면 완전 투명하게 처리 (하드 엣지)
        if (color < 0.05) {
            discard; // 픽셀 완전히 제거
        }
        
        // 가장자리 부분 페이딩 처리
        if (color < 0.3) {
            alpha = smoothstep(0.05, 0.3, color);
        }
        
        // 원형 페이드아웃 - 가장자리에서 부드럽게 사라지도록
        if (dist > 0.4) {
            alpha *= smoothstep(0.5, 0.4, dist);
        }
        
        // 시간 기반 투명도 애니메이션
        // 0초 ~ 0.5초: 0 -> 1 (페이드 인)
        // 0.5초 ~ 1.5초: 1 (완전 불투명)
        // 1.5초 ~ 2.0초: 1 -> 0 (페이드 아웃)
        float timeBasedOpacity = 0.0;
        if (time < 0.5) {
            // 페이드 인 (0초 ~ 0.5초)
            timeBasedOpacity = smoothstep(0.0, 0.5, time);
        } else if (time < 1.5) {
            // 완전 불투명 구간 (0.5초 ~ 1.5초)
            timeBasedOpacity = 1.0;
        } else if (time < 2.0) {
            // 페이드 아웃 (1.5초 ~ 2.0초)
            timeBasedOpacity = 1.0 - smoothstep(1.5, 2.0, time);
        }
        
        // 최종 투명도에 시간 기반 투명도 적용
        alpha *= timeBasedOpacity;
        
        gl_FragColor = vec4(fireColor, alpha);
    }`;

  const vertexShader = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  // scale이 Vector3로 전달되면 첫 번째 값을 사용
  const scaleValue = scale instanceof Vector3 ? scale.x : 1;

  return (
    <ShaderEffect
      position={position}
      vertexShader={vertexShader}
      fragmentShader={fireFragmentShader}
      scale={scaleValue * 1.2}
      color={new Color(1, 1, 1)}
      duration={2000}
      blending={AdditiveBlending}
      normal={normal}
      disableBillboard={disableBillboard}
      depthWrite={false}
      depthTest={false}
      volume={volume}
      uniforms={{
        resolution: {
          value: new Vector2(window.innerWidth, window.innerHeight),
        },
        time: { value: 0 },
      }}
    />
  );
};
