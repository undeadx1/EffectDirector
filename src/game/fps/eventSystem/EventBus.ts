// EventBus.ts - 애플리케이션 전용 이벤트 시스템

/**
 * 이벤트 핸들러 타입 정의
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventListener<T = any> = (event: T) => void;

/**
 * 이벤트 객체 인터페이스
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventObject<T = any> {
  type: string;
  detail?: T;
}

class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventListener>>;

  private constructor() {
    this.listeners = new Map();
  }

  /**
   * 싱글톤 인스턴스 접근자
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 이벤트 리스너 등록
   * @param eventName 이벤트 이름
   * @param callback 이벤트 핸들러 함수
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addEventListener<T = any>(
    eventName: string,
    callback: EventListener<T>
  ): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(callback as EventListener);
  }

  /**
   * 이벤트 리스너 제거
   * @param eventName 이벤트 이름
   * @param callback 이벤트 핸들러 함수
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public removeEventListener<T = any>(
    eventName: string,
    callback: EventListener<T>
  ): void {
    if (!this.listeners.has(eventName)) {
      return;
    }

    this.listeners.get(eventName)!.delete(callback as EventListener);

    // Set이 비어있으면 Map에서 제거
    if (this.listeners.get(eventName)!.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * 이벤트 발생시키기
   * @param eventName 이벤트 이름
   * @param detail 이벤트와 함께 전달할 데이터
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public dispatchEvent<T = any>(eventName: string, detail?: T): boolean {
    if (!this.listeners.has(eventName)) {
      return false;
    }

    const event: EventObject<T> = {
      type: eventName,
      detail,
    };

    this.listeners.get(eventName)!.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });

    return true;
  }

  /**
   * 특정 이벤트에 연결된 모든 리스너 제거
   * @param eventName 이벤트 이름 (생략 시 모든 이벤트)
   */
  public clearEventListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 디버깅용: 등록된 이벤트 리스너 수 확인
   */
  public getListenerCount(eventName: string): number {
    if (!this.listeners.has(eventName)) {
      return 0;
    }
    return this.listeners.get(eventName)!.size;
  }
}

// 싱글톤 인스턴스를 export
export const eventBus = EventBus.getInstance();

// 기본 인스턴스 export
export default eventBus;
