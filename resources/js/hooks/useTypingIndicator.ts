import { echo } from '@laravel/echo-react';
import { useEffect, useRef, useState } from 'react';

type TypingPayload = {
    userId: string;
    name?: string;
    avatarUrl?: string | null;
};

type TypingUser = {
    id: string;
    name?: string;
    avatarUrl?: string | null;
};

type UseTypingIndicatorOptions = {
    debounceMs?: number;
    expireMs?: number;
    channelType?: 'private' | 'public' | 'presence';
};

type UseTypingIndicatorParams = {
    channelName: string;
    userId: string;
    userName?: string;
    userAvatarUrl?: string | null;
};

export default function useTypingIndicator(
    params: UseTypingIndicatorParams,
    options?: UseTypingIndicatorOptions,
) {
    const { channelName, userId, userName, userAvatarUrl } = params;
    const {
        debounceMs = 800,
        expireMs = 2500,
        channelType = 'private',
    } = options ?? {};

    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
    const lastEmitRef = useRef(0);
    const expiresRef = useRef<Record<string, number>>({});
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!channelName) return;

        const e = echo();
        if (!e) return;

        const channel =
            channelType === 'public'
                ? e.channel(channelName)
                : channelType === 'presence'
                  ? e.join(channelName)
                  : e.private(channelName);

        channelRef.current = channel;

        const handleTyping = (payload: TypingPayload) => {
            if (!payload?.userId || payload.userId === userId) return;

            expiresRef.current[payload.userId] = Date.now();

            setTypingUsers((prev) => {
                const next = new Map(prev);
                const nextUser: TypingUser = {
                    id: payload.userId,
                    name: payload.name,
                    avatarUrl: payload.avatarUrl ?? null,
                };
                next.set(payload.userId, nextUser);
                return next;
            });
        };

        channel.listenForWhisper('typing', handleTyping);

        const timer = window.setInterval(() => {
            const now = Date.now();
            const expiredIds = Object.entries(expiresRef.current)
                .filter(([, timestamp]) => now - timestamp > expireMs)
                .map(([typingUserId]) => typingUserId);

            if (expiredIds.length === 0) return;

            expiredIds.forEach((typingUserId) => {
                delete expiresRef.current[typingUserId];
            });

            setTypingUsers((prev) => {
                const next = new Map(prev);
                expiredIds.forEach((id) => next.delete(id));
                return next;
            });
        }, 500);

        return () => {
            window.clearInterval(timer);
            channel.stopListeningForWhisper?.('typing');
            e.leave(channelName);
        };
    }, [channelName, channelType, expireMs, userId]);

    const sendTyping = () => {
        if (!channelName) return;

        const now = Date.now();
        if (now - lastEmitRef.current < debounceMs) return;
        lastEmitRef.current = now;

        const channel = channelRef.current;
        channel?.whisper?.('typing', {
            userId,
            name: userName,
            avatarUrl: userAvatarUrl ?? null,
        });
    };

    return {
        typingUsers,
        sendTyping,
        isSomeoneTyping: typingUsers.size > 0,
    } as const;
}
