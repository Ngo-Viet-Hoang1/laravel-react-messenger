import { echo } from '@laravel/echo-react';
import { useEffect, useRef, useState } from 'react';

export interface TypingUser {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface UseTypingIndicatorOptions {
    debounceMs?: number;
    expireMs?: number;
}

type EchoInstance = NonNullable<ReturnType<typeof echo>>;
type PrivateEchoChannel = ReturnType<EchoInstance['private']>;

export const useTypingIndicator = (
    user: TypingUser,
    options: UseTypingIndicatorOptions = {},
    channelName?: string,
) => {
    const { debounceMs = 800, expireMs = 2500 } = options;

    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(
        new Map(),
    );

    const lastEmitRef = useRef<number>(0);
    const expiresRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
        new Map(),
    );

    const channelRef = useRef<PrivateEchoChannel | null>(null);

    const sendTyping = () => {
        const now = Date.now();

        if (now - lastEmitRef.current < debounceMs) {
            return;
        }

        lastEmitRef.current = now;

        channelRef.current?.whisper('typing', { user });
    };

    useEffect(() => {
        if (!channelName) return;

        const e = echo();
        if (!e) return;

        const channel = e.private(channelName);
        const expires = expiresRef.current;

        channel.listenForWhisper('typing', ({ user }: { user: TypingUser }) => {
            setTypingUsers((prev) => {
                const updated = new Map(prev);
                updated.set(user.id, user);
                return updated;
            });

            const existingTimer = expiresRef.current.get(user.id);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const timer = setTimeout(() => {
                setTypingUsers((prev) => {
                    const updated = new Map(prev);
                    updated.delete(user.id);
                    return updated;
                });

                expiresRef.current.delete(user.id);
            }, expireMs);

            expiresRef.current.set(user.id, timer);
        });

        channelRef.current = channel;

        return () => {
            channel.stopListeningForWhisper('typing');

            expires.forEach((timer) => clearTimeout(timer));
            expires.clear();
        };
    }, [channelName, expireMs]);

    return {
        typingUsers,
        sendTyping,
    };
};

export default useTypingIndicator;
