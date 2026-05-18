import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';
import ConversationHeader from '@/Components/App/ConversationHeader';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
import { useEventBus } from '@/EventBus';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import {
    AppEventMap,
    PageProps as AppPageProps,
    ChatItem,
    ChatMessage,
    ChatMessageCollection,
    MessageAttachment,
} from '@/types';
import { isMessageForConversation } from '@/utils';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PageProps = {
    selectedConversation?: ChatItem | null;
    messages?: ChatMessageCollection | null;
};

const SCROLL_NEAR_BOTTOM_THRESHOLD = 150;

function Home({ selectedConversation = null, messages = null }: PageProps) {
    const currentUser = usePage<AppPageProps>().props.auth.user;
    const myId = Number(currentUser.id);

    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [hasLoadedAllMessages, setHasLoadedAllMessages] = useState(false);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
        () => messages?.data ?? [],
    );

    const messageIdSetRef = useRef<Set<number>>(
        new Set(messages?.data?.map((m) => m.id) ?? []),
    );

    // [Vercel Rule] rerender-derived-state-no-effect
    const [prevMessagesProp, setPrevMessagesProp] = useState(messages);
    if (messages !== prevMessagesProp) {
        setPrevMessagesProp(messages);

        const newData = messages?.data ?? [];
        setChatMessages(newData);
        messageIdSetRef.current = new Set(newData.map((m) => m.id));

        setHasLoadedAllMessages(false);
    }

    const [isAttachmentPreviewOpen, setIsAttachmentPreviewOpen] =
        useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<{
        id: number;
        attachments: MessageAttachment[];
    } | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const infiniteScrollTriggerRef = useRef<HTMLDivElement>(null);
    const isUserScrolledToBottomRef = useRef(true);
    const isFetchingOlderMessagesRef = useRef(false);

    // [Vercel Rule] advanced-use-latest
    const chatMessagesRef = useRef(chatMessages);
    chatMessagesRef.current = chatMessages;

    const { on } = useEventBus();

    const firstMessageDate = useMemo(() => {
        if (!chatMessages.length) return null;
        return new Intl.DateTimeFormat('en-En', { dateStyle: 'medium' }).format(
            new Date(chatMessages[chatMessages.length - 1].created_at),
        );
    }, [chatMessages]);

    // flex-col-reverse: scrollTop=0 = bottom visual
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        isUserScrolledToBottomRef.current =
            el.scrollTop < SCROLL_NEAR_BOTTOM_THRESHOLD;
    }, []);

    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'smooth') => {
            const el = scrollContainerRef.current;
            if (!el) return;
            el.scrollTo({ top: 0, behavior });
        },
        [],
    );

    const loadOlderMessages = useCallback(async () => {
        if (hasLoadedAllMessages || isFetchingOlderMessagesRef.current) return;
        if (!selectedConversation) return;

        const oldestMessage =
            chatMessagesRef.current[chatMessagesRef.current.length - 1];
        if (!oldestMessage) return;

        isFetchingOlderMessagesRef.current = true;
        setIsLoadingOlderMessages(true);

        try {
            const res = await axios.get<ChatMessageCollection>(
                route('message.loadOlder', oldestMessage.id),
            );
            const newMessages = res.data.data;
            if (newMessages.length === 0) {
                setHasLoadedAllMessages(true);
                return;
            }

            const unique = newMessages.filter((m) => {
                if (messageIdSetRef.current.has(m.id)) return false;
                messageIdSetRef.current.add(m.id);
                return true;
            });
            if (unique.length === 0) return;

            setChatMessages((prev) => [...prev, ...unique]);
        } finally {
            isFetchingOlderMessagesRef.current = false;
            setIsLoadingOlderMessages(false);
        }
    }, [selectedConversation, hasLoadedAllMessages]);

    const shouldIgnoreMessageEvent = useCallback(
        (message: ChatMessage) =>
            !selectedConversation ||
            !isMessageForConversation(message, selectedConversation, myId),
        [selectedConversation, myId],
    );

    const handleMessageCreated = useCallback(
        (message: ChatMessage) => {
            if (shouldIgnoreMessageEvent(message)) return;
            if (messageIdSetRef.current.has(message.id)) return;

            messageIdSetRef.current.add(message.id);
            setChatMessages((prev) => [message, ...prev]);

            const isOwnMessage = message.sender_id === myId;
            if (isUserScrolledToBottomRef.current || isOwnMessage) {
                requestAnimationFrame(() => scrollToBottom('smooth'));
            }
        },
        [shouldIgnoreMessageEvent, myId, scrollToBottom],
    );

    const handleMessageDeleted = useCallback(
        ({ message }: AppEventMap['message.deleted']) => {
            if (shouldIgnoreMessageEvent(message)) return;
            messageIdSetRef.current.delete(message.id);
            setChatMessages((prev) => prev.filter((m) => m.id !== message.id));
        },
        [shouldIgnoreMessageEvent],
    );

    useEffect(() => {
        const offCreated = on('message.created', handleMessageCreated);
        const offDeleted = on('message.deleted', handleMessageDeleted);

        return () => {
            offCreated();
            offDeleted();
        };
    }, [on, handleMessageCreated, handleMessageDeleted]);

    useEffect(
        () => scrollToBottom('auto'),
        [selectedConversation?.id, scrollToBottom],
    );

    useEffect(() => {
        if (hasLoadedAllMessages) return;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (!entry?.isIntersecting) return;
            loadOlderMessages();
        });

        if (infiniteScrollTriggerRef.current) {
            observer.observe(infiniteScrollTriggerRef.current);
        }

        return () => observer.disconnect();
    }, [loadOlderMessages, hasLoadedAllMessages]);

    const handleAttachmentClick = useCallback(
        (attachments: MessageAttachment[], index: number) => {
            setPreviewAttachment({ id: index, attachments });
            setIsAttachmentPreviewOpen(true);
        },
        [],
    );

    if (!messages) {
        return (
            <EmptyState message="Please select a conversation to start chatting" />
        );
    }

    return (
        <>
            <div className="flex h-full flex-col">
                <ConversationHeader conversation={selectedConversation} />

                <div
                    ref={scrollContainerRef}
                    className="flex flex-1 flex-col-reverse overflow-y-auto p-2"
                    onScroll={handleScroll}
                >
                    {chatMessages.length === 0 ? (
                        <EmptyState message="No messages yet. Start the conversation!" />
                    ) : (
                        <>
                            {chatMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className="transition-all duration-200 ease-out"
                                >
                                    <MessageItem
                                        message={message}
                                        onAttachmentClick={
                                            handleAttachmentClick
                                        }
                                    />
                                </div>
                            ))}

                            {isLoadingOlderMessages && (
                                <div className="flex justify-center p-2 opacity-50">
                                    <span className="loading loading-spinner text-primary" />
                                </div>
                            )}

                            {hasLoadedAllMessages && (
                                <div className="flex flex-col items-center py-3 text-xs opacity-40">
                                    <div>Start of conversation</div>
                                    <div className="text-[10px]">
                                        {firstMessageDate}
                                    </div>
                                </div>
                            )}

                            {/* trigger (oldest end = logical TOP due to flex-col-reverse) */}
                            <div ref={infiniteScrollTriggerRef} />
                        </>
                    )}
                </div>

                <MessageInput conversation={selectedConversation} />
            </div>

            {previewAttachment?.attachments && (
                <AttachmentPreviewModal
                    key={previewAttachment.id}
                    index={previewAttachment.id}
                    isShow={isAttachmentPreviewOpen}
                    onClose={() => setIsAttachmentPreviewOpen(false)}
                    attachments={previewAttachment.attachments}
                />
            )}
        </>
    );
}

Home.layout = (page: React.ReactNode) => (
    <AuthenticatedLayout>
        <ChatLayout>{page}</ChatLayout>
    </AuthenticatedLayout>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-2xl font-semibold opacity-35">
        <ChatBubbleLeftRightIcon className="h-16 w-16" />
        {message}
    </div>
);

export default Home;
