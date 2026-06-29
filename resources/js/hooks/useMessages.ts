import { useE2EE } from '@/Contexts/E2EEContext';
import {
    type ChatItem,
    type ChatMessage,
    type ChatMessageCollection,
} from '@/types';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseMessagesReturn = {
    chatMessages: ChatMessage[];
    chatMessagesRef: React.MutableRefObject<ChatMessage[]>;
    isLoadingOlderMessages: boolean;
    hasLoadedAllMessages: boolean;
    firstMessageDate: string | null;
    addMessage: (message: ChatMessage) => boolean;
    markMessageDeleted: (message: ChatMessage) => void;
    loadOlderMessages: () => Promise<void>;
};

const useMessages = (
    messages: ChatMessageCollection | null | undefined,
    selectedChannel: ChatItem | null,
): UseMessagesReturn => {
    const { decryptForPeer, isE2EEReady } = useE2EE();

    const initialData = messages?.data ?? [];

    const [chatMessages, setChatMessages] =
        useState<ChatMessage[]>(initialData);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [hasLoadedAllMessages, setHasLoadedAllMessages] = useState(false);

    const [decryptedOverrides, setDecryptedOverrides] = useState<
        Record<number, string>
    >({});

    const decryptingIdsRef = useRef<Set<number>>(new Set());

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

    useEffect(() => {
        setDecryptedOverrides({});
        decryptingIdsRef.current.clear();
    }, [selectedChannel?.id]);

    useEffect(() => {
        const isSecretChat =
            isE2EEReady &&
            selectedChannel?.is_e2ee_enabled &&
            selectedChannel.peer_user_id != null;

        if (!isSecretChat) return;

        const peerUserId = selectedChannel.peer_user_id!;

        const toDecrypt = chatMessages.filter(
            (m) =>
                m.is_encrypted &&
                m.iv &&
                m.ciphertext &&
                !decryptingIdsRef.current.has(m.id),
        );

        if (toDecrypt.length === 0) return;

        toDecrypt.forEach((m) => decryptingIdsRef.current.add(m.id));

        void Promise.all(
            toDecrypt.map(async (m) => ({
                id: m.id,
                content:
                    (await decryptForPeer(m, peerUserId)) ?? '[Cannot decrypt]',
            })),
        ).then((results) => {
            setDecryptedOverrides((prev) => ({
                ...prev,
                ...Object.fromEntries(results.map((r) => [r.id, r.content])),
            }));
        });
    }, [
        chatMessages,
        isE2EEReady,
        selectedChannel?.id,
        selectedChannel?.is_e2ee_enabled,
        selectedChannel?.peer_user_id,
        decryptForPeer,
    ]);

    const chatMessagesDisplayed = useMemo(
        () =>
            chatMessages.map((m) =>
                m.is_encrypted && decryptedOverrides[m.id] !== undefined
                    ? { ...m, content: decryptedOverrides[m.id] }
                    : m,
            ),
        [chatMessages, decryptedOverrides],
    );

    const addMessage = useCallback((message: ChatMessage): boolean => {
        if (messageIdSetRef.current.has(message.id)) return false;
        messageIdSetRef.current.add(message.id);
        setChatMessages((prev) => [message, ...prev]);
        return true;
    }, []);

    const markMessageDeleted = useCallback((message: ChatMessage): void => {
        setChatMessages((prev) =>
            prev.map((current) =>
                current.id === message.id
                    ? {
                          ...current,
                          content: 'Message has been deleted.',
                          deleted_at:
                              message.deleted_at ?? new Date().toISOString(),
                          attachments: [],
                      }
                    : current,
            ),
        );
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
        chatMessages: chatMessagesDisplayed,
        chatMessagesRef,
        isLoadingOlderMessages,
        hasLoadedAllMessages,
        firstMessageDate,
        addMessage,
        markMessageDeleted,
        loadOlderMessages,
    };
};

export default useMessages;
