import {
    type ChatItem,
    type ChatMessage,
    type ChatMessageCollection,
} from '@/types';
import axios from 'axios';
import { useCallback, useMemo, useRef, useState } from 'react';

type UseMessagesReturn = {
    chatMessages: ChatMessage[];
    chatMessagesRef: React.MutableRefObject<ChatMessage[]>;
    isLoadingOlderMessages: boolean;
    hasLoadedAllMessages: boolean;
    firstMessageDate: string | null;
    addMessage: (message: ChatMessage) => boolean;
    removeMessage: (message: ChatMessage) => void;
    loadOlderMessages: () => Promise<void>;
};

const useMessages = (
    messages: ChatMessageCollection | null | undefined,
    selectedChannel: ChatItem | null,
): UseMessagesReturn => {
    const initialData = messages?.data ?? [];

    const [chatMessages, setChatMessages] =
        useState<ChatMessage[]>(initialData);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [hasLoadedAllMessages, setHasLoadedAllMessages] = useState(false);

    const messageIdSetRef = useRef<Set<number>>(
        new Set(initialData.map((m) => m.id)),
    );
    const chatMessagesRef = useRef(chatMessages);
    chatMessagesRef.current = chatMessages;

    const isFetchingRef = useRef(false);

    // [Vercel Rule] rerender-derived-state-no-effect
    const [prevMessages, setPrevMessages] = useState(messages);
    if (messages !== prevMessages) {
        setPrevMessages(messages);
        const newData = messages?.data ?? [];
        setChatMessages(newData);
        messageIdSetRef.current = new Set(newData.map((m) => m.id));
        setHasLoadedAllMessages(false);
    }

    const addMessage = useCallback((message: ChatMessage): boolean => {
        if (messageIdSetRef.current.has(message.id)) return false;
        messageIdSetRef.current.add(message.id);
        setChatMessages((prev) => [message, ...prev]);
        return true;
    }, []);

    const removeMessage = useCallback((message: ChatMessage): void => {
        messageIdSetRef.current.delete(message.id);
        setChatMessages((prev) => prev.filter((m) => m.id !== message.id));
    }, []);

    const loadOlderMessages = useCallback(async (): Promise<void> => {
        if (hasLoadedAllMessages || isFetchingRef.current || !selectedChannel)
            return;

        const oldest =
            chatMessagesRef.current[chatMessagesRef.current.length - 1];
        if (!oldest) return;

        isFetchingRef.current = true;
        setIsLoadingOlderMessages(true);

        try {
            const res = await axios.get<ChatMessageCollection>(
                route('channels.messages', selectedChannel.id),
                {
                    params: {
                        before_id: oldest.id,
                        before_at: oldest.created_at,
                    },
                },
            );

            if (!res.data.links.next) setHasLoadedAllMessages(true);

            const unique = res.data.data.filter((m) => {
                if (messageIdSetRef.current.has(m.id)) return false;
                messageIdSetRef.current.add(m.id);
                return true;
            });

            if (unique.length > 0) {
                setChatMessages((prev) => [...prev, ...unique]);
            }
        } finally {
            isFetchingRef.current = false;
            setIsLoadingOlderMessages(false);
        }
    }, [selectedChannel, hasLoadedAllMessages]);

    const firstMessageDate = useMemo(() => {
        if (!chatMessages.length) return null;
        return new Intl.DateTimeFormat('en-En', { dateStyle: 'medium' }).format(
            new Date(chatMessages[chatMessages.length - 1].created_at),
        );
    }, [chatMessages]);

    return {
        chatMessages,
        chatMessagesRef,
        isLoadingOlderMessages,
        hasLoadedAllMessages,
        firstMessageDate,
        addMessage,
        removeMessage,
        loadOlderMessages,
    };
};

export default useMessages;
