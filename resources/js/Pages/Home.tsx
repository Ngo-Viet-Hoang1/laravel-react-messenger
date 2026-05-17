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
import { useCallback, useEffect, useRef, useState } from 'react';

type PageProps = {
    selectedConversation?: ChatItem | null;
    messages?: ChatMessageCollection | null;
};

function Home({ selectedConversation = null, messages = null }: PageProps) {
    const currentUser = usePage<AppPageProps>().props.auth.user;
    const myId = Number(currentUser.id);

    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [hasLoadedAllMessages, setHasLoadedAllMessages] = useState(false);
    const [scrollOffsetFromBottom, setScrollOffsetFromBottom] = useState<
        number | null
    >(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
        messages?.data ? [...messages.data].reverse() : [],
    );
    // [Vercel Rule] rerender-derived-state-no-effect: Derive state during render instead of useEffect
    const [prevMessagesProp, setPrevMessagesProp] = useState(messages);
    if (messages !== prevMessagesProp) {
        setPrevMessagesProp(messages);
        setChatMessages(messages?.data ? [...messages.data].reverse() : []);
        setHasLoadedAllMessages(false);
        setScrollOffsetFromBottom(0);
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

    // [Vercel Rule] advanced-use-latest: Stable ref for latest messages to avoid stale closure and prevent unnecessary hook recreations
    const chatMessagesRef = useRef(chatMessages);
    chatMessagesRef.current = chatMessages;

    const { on } = useEventBus();

    const loadOlderMessages = useCallback(async () => {
        if (hasLoadedAllMessages || isFetchingOlderMessagesRef.current) return;
        if (!selectedConversation) return;

        const oldestMessage = chatMessagesRef.current[0];
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

            const el = scrollContainerRef.current;
            if (el) {
                // Keep the scroll offset from bottom to restore position after loading more messages
                const distanceFromBottom =
                    el.scrollHeight - el.scrollTop - el.clientHeight;
                setScrollOffsetFromBottom(distanceFromBottom);
            }

            setChatMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const uniqueNew = newMessages.filter(
                    (m) => !existingIds.has(m.id),
                );
                return [...uniqueNew.reverse(), ...prev];
            });
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

    useEffect(() => {
        const offCreated = on('message.created', (message: ChatMessage) => {
            if (shouldIgnoreMessageEvent(message)) return;
            setChatMessages((prev) =>
                prev.some((m) => m.id === message.id)
                    ? prev
                    : [...prev, message],
            );
        });

        const offDeleted = on(
            'message.deleted',
            ({ message }: AppEventMap['message.deleted']) => {
                if (shouldIgnoreMessageEvent(message)) return;
                setChatMessages((prev) =>
                    prev.filter((m) => m.id !== message.id),
                );
            },
        );

        return () => {
            offCreated();
            offDeleted();
        };
    }, [shouldIgnoreMessageEvent, on]);

    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        isUserScrolledToBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    }, []);

    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'smooth') => {
            const el = scrollContainerRef.current;
            if (!el) return;

            el.scrollTo({
                top: el.scrollHeight,
                behavior,
            });
        },
        [],
    );

    // Scroll to bottom on new messages if user is near the bottom or if it's the first load (<=10 messages)
    useEffect(() => {
        if (isUserScrolledToBottomRef.current || chatMessages.length <= 10) {
            requestAnimationFrame(() => scrollToBottom('smooth'));
        }
    }, [chatMessages.length, selectedConversation?.id, scrollToBottom]);

    // Scroll to bottom when container size changes (e.g., opening the phone keyboard or new message with attachments),
    // but only if user is currently at the bottom
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const resizeObserver = new ResizeObserver(() => {
            if (isUserScrolledToBottomRef.current) {
                scrollToBottom('auto');
            }
        });

        if (el.firstElementChild) {
            resizeObserver.observe(el.firstElementChild);
        }

        return () => resizeObserver.disconnect();
    }, [selectedConversation?.id, scrollToBottom]);

    // Restore scroll position after loading old messages
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el || scrollOffsetFromBottom === null) return;

        el.scrollTop =
            el.scrollHeight - el.clientHeight - scrollOffsetFromBottom;
    }, [scrollOffsetFromBottom]);

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

    const handleAttachmentClick = (
        attachments: MessageAttachment[],
        index: number,
    ) => {
        setPreviewAttachment({ id: index, attachments });
        setIsAttachmentPreviewOpen(true);
    };

    const firstMessageDate = new Intl.DateTimeFormat('en-En', {
        dateStyle: 'medium',
    }).format(new Date(chatMessages[0].created_at));

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
                    className="flex flex-1 flex-col overflow-y-auto p-2"
                    onScroll={handleScroll}
                >
                    {chatMessages.length === 0 ? (
                        <EmptyState message="No messages yet. Start the conversation!" />
                    ) : (
                        <div className="flex shrink-0 flex-col">
                            <div ref={infiniteScrollTriggerRef} />

                            {hasLoadedAllMessages &&
                                chatMessages.length > 0 && (
                                    <div className="flex flex-col items-center py-3 text-xs opacity-40">
                                        <div>Start of conversation</div>
                                        <div className="text-[10px]">
                                            {firstMessageDate}
                                        </div>
                                    </div>
                                )}

                            {isLoadingOlderMessages && (
                                <div className="flex justify-center p-2 opacity-50">
                                    <span className="loading loading-spinner text-primary"></span>
                                </div>
                            )}

                            {chatMessages.map((message) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    onAttachmentClick={handleAttachmentClick}
                                />
                            ))}
                        </div>
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
