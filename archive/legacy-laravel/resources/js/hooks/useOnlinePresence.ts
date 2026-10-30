import { type User } from '@/types';
import { echo } from '@laravel/echo-react';
import { useCallback, useEffect, useState } from 'react';

type UseOnlinePresenceReturn = {
    isOnline: (userId: number | null | undefined) => boolean;
};

const useOnlinePresence = (): UseOnlinePresenceReturn => {
    const [onlineUsers, setOnlineUsers] = useState<Record<number, User>>({});

    useEffect(() => {
        const e = echo();
        if (!e) return;

        e.join('online')
            .here((users: User[]) => {
                setOnlineUsers(Object.fromEntries(users.map((u) => [u.id, u])));
            })
            .joining((user: User) => {
                setOnlineUsers((prev) => ({ ...prev, [user.id]: user }));
            })
            .leaving((user: User) => {
                setOnlineUsers((prev) => {
                    const next = { ...prev };
                    delete next[user.id];
                    return next;
                });
            })
            .error((error: Error) =>
                console.error('Online channel error:', error),
            );

        return () => e.leave('online');
    }, []);

    const isOnline = useCallback(
        (userId: number | null | undefined): boolean => {
            if (userId == null) return false;
            return userId in onlineUsers;
        },
        [onlineUsers],
    );

    return { isOnline };
};

export default useOnlinePresence;
