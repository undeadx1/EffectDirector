import React from 'react';

const Crosshair = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 100 100">
        {/* 중앙 점 */}
        <circle cx="50" cy="50" r="2" fill="white" />

        {/* 상단 선 */}
        <rect x="49" y="20" width="2" height="20" fill="white" />

        {/* 하단 선 */}
        <rect x="49" y="60" width="2" height="20" fill="white" />

        {/* 왼쪽 선 */}
        <rect x="20" y="49" width="20" height="2" fill="white" />

        {/* 오른쪽 선 */}
        <rect x="60" y="49" width="20" height="2" fill="white" />
      </svg>
    </div>
  );
};

export default Crosshair;
