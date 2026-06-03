import { useEffect, useRef, useState } from 'react';
import { echo } from '@laravel/echo-react';

export interface TypingUser {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface UseTypingIndicatorOptions {
    debounceMs?: number;
    expireMs?: number;
    channelType?: 'public' | 'private';
}

export const useTypingIndicator = (
    user: TypingUser,
    options: UseTypingIndicatorOptions = {},
    channelName?: string,
) => {
    const { debounceMs = 800, expireMs = 2500, channelType = 'private' } = options;

    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
    const lastEmitRef = useRef<number>(0);
    const expiresRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelRef = useRef<any>(null);

    // Send typing whisper (throttled)
    const sendTyping = () => {
        const now = Date.now();
        if (now - lastEmitRef.current < debounceMs) {
            return;
        }

        lastEmitRef.current = now;

        if (channelRef.current) {
            channelRef.current.whisper('typing', { user });
        }
    };

    // Subscribe to channel
    useEffect(() => {
        if (!channelName) return;

        const e = echo();
        if (!e) return;

        const channel =
            channelType === 'private' ? e.private(channelName) : e.channel(channelName);

        channel.listenForWhisper('typing', (data: { user: TypingUser }) => {
            setTypingUsers((prev) => {
                const updated = new Map(prev);
                updated.set(data.user.id, data.user);
                return updated;
            });

            const existingTimer = expiresRef.current.get(data.user.id);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const timer = setTimeout(() => {
                setTypingUsers((prev) => {
                    const updated = new Map(prev);
                    updated.delete(data.user.id);
                    return updated;
                });
                expiresRef.current.delete(data.user.id);
            }, expireMs);

            expiresRef.current.set(data.user.id, timer);
        });

        channelRef.current = channel;

        return () => {
            channel.stopListeningForWhisper('typing');
            expiresRef.current.forEach((timer) => clearTimeout(timer));
            expiresRef.current.clear();
        };
    }, [channelName, channelType, expireMs]);

    return {
        typingUsers,
        sendTyping,
    };
};

export default useTypingIndicator;
