import * as React from 'react';
import { getSignalRConnection, HubConnectionState } from '@/shared/lib/signalr';

const EMIT_THROTTLE_MS = 2000;
const AUTO_STOP_DELAY_MS = 2800;

export interface UseTypingPublisherReturn {
  handleTyping: () => void;
  handleStoppedTyping: () => void;
}

export const useTypingPublisher = (channelId?: string): UseTypingPublisherReturn => {
  const isTypingRef = React.useRef(false);
  const lastEmitTimeRef = React.useRef(0);
  const stopTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStoppedTyping = React.useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (!isTypingRef.current || !channelId) {
      return;
    }

    isTypingRef.current = false;
    lastEmitTimeRef.current = 0;

    const connection = getSignalRConnection();
    if (connection.state === HubConnectionState.Connected) {
      connection.invoke('SendStoppedTyping', channelId).catch(() => {});
    }
  }, [channelId]);

  const handleTyping = React.useCallback(() => {
    if (!channelId) return;

    const now = Date.now();
    const shouldEmit = !isTypingRef.current || now - lastEmitTimeRef.current > EMIT_THROTTLE_MS;

    if (shouldEmit) {
      isTypingRef.current = true;
      lastEmitTimeRef.current = now;

      const connection = getSignalRConnection();
      if (connection.state === HubConnectionState.Connected) {
        connection.invoke('SendTyping', channelId).catch(() => {});
      }
    }

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }

    stopTimeoutRef.current = setTimeout(() => {
      handleStoppedTyping();
    }, AUTO_STOP_DELAY_MS);
  }, [channelId, handleStoppedTyping]);

  React.useEffect(() => {
    return () => {
      handleStoppedTyping();
    };
  }, [channelId, handleStoppedTyping]);

  return {
    handleTyping,
    handleStoppedTyping,
  };
};
