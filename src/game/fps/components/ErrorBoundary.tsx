import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary 컴포넌트
 * 자식 컴포넌트에서 발생한 오류를 캡처하고 폴백 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 오류 발생 시 상태 업데이트
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 오류 로깅
    console.error('ErrorBoundary 오류 발생:', error);
    console.error('컴포넌트 스택:', errorInfo.componentStack);
  }

  render(): ReactNode {
    // 오류가 발생하면 폴백 UI 표시
    if (this.state.hasError) {
      return this.props.fallback;
    }

    // 정상적인 경우 자식 렌더링
    return this.props.children;
  }
}
