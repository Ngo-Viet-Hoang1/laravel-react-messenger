import { useEventBus } from '@/EventBus';
import { ChatItem, MessageCreatedEvent } from '@/types';
import {
    ChannelDeletedEvent,
    ChannelReadUpdatedEvent,
    MessageDeletedEvent,
    MessageReactionUpdatedEvent,
} from '@/types/events';
import { getChannelName } from '@/utils';
import { echo } from '@laravel/echo-react';
import { useEffect, useMemo, useRef } from 'react';

const useChannelSockets = (channels: ChatItem[], userId: number) => {
    const { emit } = useEventBus();
    const subscribedRef = useRef<Set<string>>(new Set());

    const channelNames = useMemo(
        () => channels.map(getChannelName).sort(),
        [channels],
    );

    useEffect(() => {
        const e = echo();
        if (!e) return;

        const next = new Set(channelNames);
        const prev = subscribedRef.current;

        for (const cName of next) {
            if (!prev.has(cName)) {
                e.private(cName)
                    .stopListening('MessageCreated')
                    .listen('MessageCreated', (event: MessageCreatedEvent) => {
                        emit('message.created', event.message);
                    })
                    .stopListening('MessageDeleted')
                    .listen('MessageDeleted', (event: MessageDeletedEvent) => {
                        emit('message.deleted', event);
                    })
                    .stopListening('MessageReactionUpdated')
                    .listen('MessageReactionUpdated', (event: MessageReactionUpdatedEvent) => {
                        emit('message.reaction.updated', event);
                    });
            }
        }

        for (const cName of prev) {
            if (!next.has(cName)) {
                e.leave(cName);
            }
        }

        subscribedRef.current = next;
    }, [channelNames, emit]);

    useEffect(() => {
        const e = echo();
        if (!e) return;

        const channelName = `user.${userId}`;
        const channel = e.private(channelName);

        channel
            .error((error: Error) =>
                console.error('User channel error:', error),
            )
            .listen('ChannelDeleted', ({ id, name }: ChannelDeletedEvent) => {
                emit('channel.deleted', { id, name });
            })
            .listen('ChannelReadUpdated', (event: ChannelReadUpdatedEvent) => {
                emit('channel.read.updated', event);
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
};

export default useChannelSockets;
