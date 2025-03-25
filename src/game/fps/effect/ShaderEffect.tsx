import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { animated } from '@react-spring/three';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Vector3,
  Mesh,
  Blending,
  Euler,
  Quaternion,
  ShaderMaterial,
  Vector2,
  Matrix4,
} from 'three';
import { extend } from '@react-three/fiber';

// 커스텀 셰이더 머티리얼 클래스 정의
class CustomShaderMaterial extends ShaderMaterial {
  constructor(props: any) {
    super({
      uniforms: {
        time: { value: 0 },
        resolution: {
          value: new Vector2(window.innerWidth, window.innerHeight),
        },
        color: { value: new Color(1, 1, 1) },
        invModelMatrix: { value: new Matrix4() },
        scale: { value: new Vector3(1, 1, 1) },
        ...props.uniforms,
      },
      vertexShader: props.vertexShader,
      fragmentShader: props.fragmentShader,
      transparent: true,
      ...props,
    });
  }
}

extend({ CustomShaderMaterial });

interface ShaderEffectProps {
  position: Vector3;
  vertexShader: string;
  fragmentShader: string;
  uniforms?: Record<string, any>;
  scale?: number;
  color?: Color;
  opacity?: number;
  loop?: boolean;
  blending?: number;
  depthWrite?: boolean;
  depthTest?: boolean;
  polygonOffset?: boolean;
  polygonOffsetFactor?: number;
  polygonOffsetUnits?: number;
  fadeOut?: boolean;
  autoPlay?: boolean;
  rotation?: Euler;
  onComplete?: () => void;
  // 애니메이션 속성
  scaleAnimation?: {
    start: number;
    mid: number;
    end: number;
  };
  opacityAnimation?: {
    start: number;
    mid: number;
    end: number;
  };
  // 빌보드 효과를 비활성화하는 옵션
  disableBillboard?: boolean;
  // 표면 법선 벡터 (벽에 붙이는 효과 등에 사용)
  normal?: Vector3;
  // 셰이더 실행 시간 (밀리초)
  duration?: number;
  materialRef?: React.RefObject<CustomShaderMaterial>;
  // 볼륨 렌더링 모드 (다중 평면으로 볼륨감 표현)
  volume?: boolean;
}

export const ShaderEffect: React.FC<ShaderEffectProps> = ({
  position,
  vertexShader,
  fragmentShader,
  color = new Color(1, 1, 1),
  duration = 1000,
  scaleAnimation,
  opacityAnimation,
  fadeOut,
  normal,
  uniforms = {},
  materialRef: externalMaterialRef,
  disableBillboard = false,
  rotation,
  blending = AdditiveBlending,
  scale = 1,
  volume = false,
}) => {
  const meshRef = useRef<Mesh>(null);
  const internalMaterialRef = useRef<ShaderMaterial>(null);
  const materialRef = externalMaterialRef || internalMaterialRef;
  const [opacity, setOpacity] = useState(1);
  const [currentScale, setCurrentScale] = useState(scale);
  const [isVisible, setIsVisible] = useState(true);
  const timeRef = useRef(0);
  const { camera } = useThree();

  // 셰이더 머티리얼 생성
  const shaderMaterialProps = {
    vertexShader,
    fragmentShader,
    uniforms: {
      color: { value: color },
      opacity: { value: opacity },
      time: { value: 0 },
      resolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
      invModelMatrix: { value: new Matrix4() },
      scale: { value: new Vector3(1, 1, 1) },
      ...uniforms,
    },
    transparent: true,
    side: DoubleSide,
    blending: blending as Blending,
  };

  // 법선 벡터에 따른 회전을 위한 quaternion 저장
  const normalRotationRef = useRef<Quaternion | null>(null);

  // 법선 벡터가 제공되면 해당 방향으로 향하는 회전 계산
  useEffect(() => {
    if (normal) {
      const upVector = new Vector3(0, 1, 0);
      const quaternion = new Quaternion();
      quaternion.setFromUnitVectors(upVector, normal.clone().normalize());
      normalRotationRef.current = quaternion;
      if (meshRef.current) {
        meshRef.current.quaternion.copy(quaternion);
      }
    }
  }, [normal, disableBillboard]);

  // 시간 업데이트와 빌보드 효과를 위한 useFrame
  useFrame((_, delta) => {
    // 시간 업데이트
    timeRef.current += delta;

    if (!meshRef.current || !materialRef.current) return;

    // Uniform 업데이트
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.opacity.value = opacity;

    // 메시 업데이트
    meshRef.current.scale.set(currentScale, currentScale, currentScale);

    // 빌보드 효과 (disableBillboard가 false일 때만 적용)
    if (!disableBillboard) {
      // 카메라에서 메시까지의 방향 벡터 계산
      const dirToCam = camera.position.clone().sub(meshRef.current.position);

      // 월드 up 벡터 (Y축)
      const worldUp = new Vector3(0, 1, 0);

      // 카메라 방향과 월드 up 벡터로 right 벡터 계산 (외적)
      const right = new Vector3().crossVectors(dirToCam, worldUp).normalize();

      // right 벡터와 카메라 방향으로 up 벡터 재계산 (이렇게 하면 항상 Y축을 향함)
      const up = new Vector3().crossVectors(right, dirToCam).normalize();

      // 세 축으로 회전 행렬 생성
      const rotationMatrix = new Matrix4().makeBasis(
        right,
        up,
        dirToCam.normalize().negate()
      );

      // 회전 행렬에서 쿼터니언 추출
      const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

      // 메시에 쿼터니언 적용
      meshRef.current.quaternion.copy(quaternion);

      // Z축 회전 적용 (rotation 파라미터가 있는 경우)
      if (rotation) {
        // Z축 회전을 위한 쿼터니언 생성
        const zRotation = new Quaternion().setFromAxisAngle(
          new Vector3(0, 0, 1), // Z축
          rotation.z // 회전 각도
        );

        // 현재 쿼터니언에 Z축 회전 적용
        meshRef.current.quaternion.multiply(zRotation);
      }
    } else if (normal && normalRotationRef.current) {
      meshRef.current.quaternion.copy(normalRotationRef.current);
      if (rotation) {
        const rotationQuat = new Quaternion();
        rotationQuat.setFromEuler(rotation);
        meshRef.current.quaternion.multiply(rotationQuat);
      }
    } else if (rotation) {
      meshRef.current.setRotationFromEuler(rotation);
    }
  });

  useEffect(() => {
    if (!meshRef.current) return;

    const startTime = Date.now();
    let animationFrameId: number;

    const updateEffect = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 스케일 애니메이션
      if (scaleAnimation) {
        const { start, mid, end } = scaleAnimation;
        let newScale = scale;

        if (progress < 0.5) {
          const t = progress * 2;
          newScale = scale * (start + (mid - start) * t);
        } else {
          const t = (progress - 0.5) * 2;
          newScale = scale * (mid + (end - mid) * t);
        }

        setCurrentScale(newScale);
      }

      // 투명도 애니메이션
      if (opacityAnimation) {
        const { start, mid, end } = opacityAnimation;
        let newOpacity = 1;

        if (progress < 0.5) {
          const t = progress * 2;
          newOpacity = start + (mid - start) * t;
        } else {
          const t = (progress - 0.5) * 2;
          newOpacity = mid + (end - mid) * t;
        }

        setOpacity(newOpacity);
      }

      // 페이드 아웃
      if (fadeOut && progress > 0.7) {
        const fadeProgress = (progress - 0.7) / 0.3;
        setOpacity((prev) => Math.max(0, prev * (1 - fadeProgress)));
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateEffect);
      } else {
        setIsVisible(false);
      }
    };

    updateEffect();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, scaleAnimation, opacityAnimation, fadeOut, scale]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.resolution.value.set(
          window.innerWidth,
          window.innerHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isVisible) return null;

  // 벽으로부터의 오프셋 계산
  const offsetPosition = position.clone();
  if (normal) {
    // 법선 방향으로 약간 앞으로 이동 (0.1 유닛)
    offsetPosition.add(normal.clone().multiplyScalar(0.1));
  }

  // 수정된 쉐이더 속성
  const modifiedShaderProps = {
    ...shaderMaterialProps,
    side: DoubleSide,
  };

  // 항상 카메라를 향하는 플랫 패널 사용
  return (
    <animated.mesh ref={meshRef} position={offsetPosition}>
      {volume ? (
        // 볼륨 렌더링 모드 - 다중 평면 사용
        <group>
          {/* 기본 평면 */}
          <mesh>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial ref={materialRef} args={[modifiedShaderProps]} />
          </mesh>

          {/* 90도 회전 (X축) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              ref={internalMaterialRef}
              args={[modifiedShaderProps]}
            />
          </mesh>

          {/* 90도 회전 (Y축) */}
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              ref={internalMaterialRef}
              args={[modifiedShaderProps]}
            />
          </mesh>

          {/* 45도 회전 (대각선 #1) */}
          <mesh rotation={[0, Math.PI / 4, Math.PI / 4]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              ref={internalMaterialRef}
              args={[modifiedShaderProps]}
            />
          </mesh>

          {/* -45도 회전 (대각선 #2) */}
          <mesh rotation={[0, -Math.PI / 4, Math.PI / 4]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              ref={internalMaterialRef}
              args={[modifiedShaderProps]}
            />
          </mesh>
        </group>
      ) : (
        // 일반 모드 - 단일 평면 사용
        <>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial ref={materialRef} args={[modifiedShaderProps]} />
        </>
      )}
    </animated.mesh>
  );
};

export default ShaderEffect;
