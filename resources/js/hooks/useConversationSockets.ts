import { useEventBus } from '@/EventBus';
import { ChatItem, SocketMessageEvent } from '@/types';
import { GroupDeletedEvent } from '@/types/events';
import { getChannelName } from '@/utils';
import { echo } from '@laravel/echo-react';
import { useCallback, useEffect, useRef } from 'react';

export default function useConversationSockets(
    conversations: ChatItem[],
    userId: number,
) {
    const { emit } = useEventBus();
    const subscribedRef = useRef<Set<string>>(new Set());

    const handler = useCallback(
        (event: SocketMessageEvent) => {
            const message = event.message;

            emit('message.created', message);

            if (message.sender_id !== userId) {
                emit('newMessageNotification', {
                    user: message.sender,
                    group_id: message.group_id,
                    message:
                        message.message ||
                        `Shared ${message.attachments.length} attachment(s)`,
                });
            }
        },
        [emit, userId],
    );

    const channelNamesStr =
        conversations
            ?.map((c) => getChannelName(c, userId))
            .sort()
            .join(',') || '';

    useEffect(() => {
        const e = echo();
        if (!e) return;

        const next = new Set(channelNamesStr ? channelNamesStr.split(',') : []);

        const prev = subscribedRef.current;

        next.forEach((channel) => {
            if (!prev.has(channel)) {
                const ch = e.private(channel);
                ch.stopListening('SocketMessage');
                ch.listen('SocketMessage', handler);
            }
        });

        prev.forEach((channel) => {
            if (!next.has(channel)) {
                e.leave(channel);
            }
        });

        subscribedRef.current = next;
    }, [channelNamesStr, handler]);

    useEffect(() => {
        const e = echo();
        if (!e) return;

        const channelName = `user.${userId}`;
        const channel = e.private(channelName);

        channel
            .error((error: Error) =>
                console.error('Group deleted error:', error),
            )
            .listen('GroupDeleted', ({ id, name }: GroupDeletedEvent) => {
                emit('group.deleted', { id, name });
            });

        return () => {
            e.leave(channelName);
        };
    }, [emit, userId]);

    useEffect(() => {
        return () => {
            const e = echo();
            if (!e) return;

            for (const channel of subscribedRef.current) {
                e.leave(channel);
            }

            subscribedRef.current = new Set();
        };
    }, []);
}
