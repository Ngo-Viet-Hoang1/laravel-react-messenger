import { type ChatItem, type ChatMessage } from '@/types';
import { type MessageDeletedEvent } from '@/types/events';
import { getTime } from '@/utils/chatTime.util';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UseChannelsReturn = {
    sortedChannels: ChatItem[];
    updateLastMessage: (message: ChatMessage) => void;
    updateAfterMessageDeleted: (event: MessageDeletedEvent) => void;
    removeChannel: (id: number) => void;
};

const useChannels = (
    initialChannels: ChatItem[],
    search: string,
): UseChannelsReturn => {
    const [channelsMap, setChannelsMap] = useState<Record<number, ChatItem>>(
        () => Object.fromEntries(initialChannels.map((c) => [c.id, c])),
    );

    useEffect(() => {
        setChannelsMap(
            Object.fromEntries(initialChannels.map((c) => [c.id, c])),
        );
    }, [initialChannels]);

    const updateLastMessage = useCallback((message: ChatMessage) => {
        setChannelsMap((prev) => {
            const channel = prev[message.channel_id];
            if (!channel) return prev;
            return {
                ...prev,
                [message.channel_id]: {
                    ...channel,
                    last_message: message.content,
                    last_message_date: message.created_at,
                },
            };
        });
    }, []);

    const updateAfterMessageDeleted = useCallback(
        ({ message, newLastMessage }: MessageDeletedEvent) => {
            setChannelsMap((prev) => {
                const channel = prev[message.channel_id];
                if (!channel) return prev;
                return {
                    ...prev,
                    [message.channel_id]: {
                        ...channel,
                        last_message: newLastMessage?.content ?? null,
                        last_message_date: newLastMessage?.created_at ?? null,
                    },
                };
            });
        },
        [],
    );

    const removeChannel = useCallback((id: number) => {
        setChannelsMap((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const sortedChannels = useMemo(() => {
        return Object.values(channelsMap)
            .filter((c) => c.name?.toLocaleLowerCase().includes(search))
            .sort((a, b) => {
                const aBlocked = getTime(a.blocked_at);
                const bBlocked = getTime(b.blocked_at);

                if (!!aBlocked !== !!bBlocked) return aBlocked ? 1 : -1;
                if (aBlocked && bBlocked) return bBlocked - aBlocked;

                const aLast = getTime(a.last_message_date);
                const bLast = getTime(b.last_message_date);

                if (aLast && bLast) return bLast - aLast;
                if (aLast) return -1;
                if (bLast) return 1;

                return (a.name ?? '').localeCompare(b.name ?? '');
            });
    }, [channelsMap, search]);

    return {
        sortedChannels,
        updateLastMessage,
        updateAfterMessageDeleted,
        removeChannel,
    };
};

export default useChannels;
