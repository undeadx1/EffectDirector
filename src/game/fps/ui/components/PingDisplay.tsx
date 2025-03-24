import React, { useEffect, useState } from 'react';
import { useFpsGameNetwork } from '@/game/fps/hooks/useFpsGameNetwork';

/**
 * PingDisplay 컴포넌트 Props
 * @interface PingDisplayProps
 */
interface PingDisplayProps {
  /** 컴포넌트 너비 (기본값: 80px) */
  width?: number | string;
  /** 핑 업데이트 간격 (ms) (기본값: 5000) */
  updateInterval?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: React.CSSProperties;
}

/**
 * 네트워크 핑 표시 컴포넌트
 *
 * 네트워크 핑 값에 따라 색상이 변화함
 * @component
 */
const PingDisplay: React.FC<PingDisplayProps> = ({
  width = 50,
  updateInterval = 5000,
  className,
  style,
}) => {
  const [ping, setPing] = useState<number>(0);
  const { getPing } = useFpsGameNetwork();

  // ======== 핑 업데이트 처리 ========
  useEffect(() => {
    let isMounted = true;

    const updatePing = async () => {
      if (!isMounted) return;
      try {
        const pingData = await getPing();
        setPing(pingData.ping);
      } catch (error) {
        console.error('Failed to get ping:', error);
      }

      // 설정된 간격마다 핑 업데이트
      setTimeout(updatePing, updateInterval);
    };

    updatePing();

    return () => {
      isMounted = false;
    };
  }, [getPing, updateInterval]);

  // 핑 값에 따른 색상 결정
  const getPingColor = () => {
    if (ping > 300) return '#ef4444'; // red-500 (나쁨)
    if (ping > 150) return '#fb923c'; // orange-400 (주의)
    return '#22c55e'; // green-500 (좋음)
  };

  // 기본 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    padding: '8px 12px',
    width: width,
    display: 'flex',
    justifyContent: 'center',
    ...style,
  };

  return (
    <div style={containerStyle} className={className}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getPingColor(),
            boxShadow: `0 0 8px ${getPingColor()}`,
          }}
        ></div>
        <span
          style={{
            color: 'white',
            fontSize: '14px',
          }}
        >
          {ping}ms
        </span>
      </div>
    </div>
  );
};

export default PingDisplay;
