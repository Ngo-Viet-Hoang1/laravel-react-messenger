import * as React from 'react';
import { useSignalREvent } from '@/shared/lib/signalr';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';

const TYPER_EXPIRY_MS = 3500;

interface ActiveTyper {
  userId: string;
  username: string;
  expiresAt: number;
}

export const useTypingUsers = (channelId?: string): { typingText: string | null } => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [typers, setTypers] = React.useState<Record<string, ActiveTyper>>({});

  React.useEffect(() => {
    setTypers({});
  }, [channelId]);

  useSignalREvent(
    'UserTyping',
    React.useCallback(
      (incomingChannelId: string, userId: string, username: string) => {
        if (!channelId || incomingChannelId !== channelId || userId === currentUser?.id) {
          return;
        }

        const now = Date.now();
        setTypers((prev) => ({
          ...prev,
          [userId]: {
            userId,
            username,
            expiresAt: now + TYPER_EXPIRY_MS,
          },
        }));
      },
      [channelId, currentUser?.id]
    )
  );

  useSignalREvent(
    'UserStoppedTyping',
    React.useCallback(
      (incomingChannelId: string, userId: string) => {
        if (!channelId || incomingChannelId !== channelId) {
          return;
        }

        setTypers((prev) => {
          if (!prev[userId]) return prev;
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      },
      [channelId]
    )
  );

  // Auto-expiry periodic cleaner for stale typers
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypers((prev) => {
        let hasExpired = false;
        const updated: Record<string, ActiveTyper> = {};

        for (const [id, typer] of Object.entries(prev)) {
          if (typer.expiresAt > now) {
            updated[id] = typer;
          } else {
            hasExpired = true;
          }
        }

        return hasExpired ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const typingText = React.useMemo(() => {
    const list = Object.values(typers);
    if (list.length === 0) return null;

    if (list.length === 1) {
      return `${list[0].username} is typing...`;
    }

    if (list.length === 2) {
      return `${list[0].username} and ${list[1].username} are typing...`;
    }

    return `${list[0].username}, ${list[1].username} and ${list.length - 2} others are typing...`;
  }, [typers]);

  return { typingText };
};
