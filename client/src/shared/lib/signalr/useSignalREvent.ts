import { useEffect, useRef } from 'react';
import { getSignalRConnection } from './signalrConnection';
import type { ChatClientEvents } from './types';

export function useSignalREvent<K extends keyof ChatClientEvents>(
  eventName: K,
  handler: ChatClientEvents[K]
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const connection = getSignalRConnection();

    const callback = (...args: unknown[]) => {
      (handlerRef.current as (...a: unknown[]) => void)(...args);
    };

    connection.on(eventName, callback);

    return () => {
      connection.off(eventName, callback);
    };
  }, [eventName]);
}
