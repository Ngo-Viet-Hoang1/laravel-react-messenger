import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';
import ChannelHeader from '@/Components/App/ChannelHeader';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
import TypingIndicator from '@/Components/App/TypingIndicator';
import { useEventBus } from '@/EventBus';
import useAttachmentsPreviewModal from '@/hooks/useAttachmentsPreviewModal';
import useChatScroll from '@/hooks/useChatScroll';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import useMessages from '@/hooks/useMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import {
    PageProps as AppPageProps,
    ChatItem,
    ChatMessage,
    ChatMessageCollection,
} from '@/types';
import { MessageDeletedEvent, MessagesClearedEvent } from '@/types/events';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

type PageProps = {
    selectedChannel?: ChatItem | null;
    messages?: ChatMessageCollection | null;
};

function Home({ selectedChannel = null, messages = null }: PageProps) {
    const currentUser = usePage<AppPageProps>().props.auth.user;
    const myId = Number(currentUser.id);
    const { on, emit } = useEventBus();
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const markReadTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const lastScheduledReadIdRef = useRef<number | null>(null);

    const {
        chatMessages,
        isLoadingOlderMessages,
        hasLoadedAllMessages,
        firstMessageDate,
        addMessage,
        markMessageDeleted,
        clearMessages,
        loadOlderMessages,
    } = useMessages(messages, selectedChannel);

    const {
        scrollContainerRef,
        handleScroll: handleChatScroll,
        scrollToBottom,
    } = useChatScroll();

    const { triggerRef } = useInfiniteScroll(
        loadOlderMessages,
        hasLoadedAllMessages,
    );

    const { isOpen, preview, open, close } = useAttachmentsPreviewModal();

    useEffect(() => {
        scrollToBottom('auto');
    }, [selectedChannel?.id, scrollToBottom]);

    useEffect(() => {
        setReplyTo(null);
        lastScheduledReadIdRef.current = null;
    }, [selectedChannel?.id]);

    useEffect(() => {
        return () => {
            if (markReadTimerRef.current) {
                globalThis.clearTimeout(markReadTimerRef.current);
            }
        };
    }, []);

    const scheduleMarkAsRead = useCallback(
        (messageId: number | null) => {
            if (!selectedChannel || messageId == null) return;
            if (lastScheduledReadIdRef.current === messageId) return;

            lastScheduledReadIdRef.current = messageId;

            if (markReadTimerRef.current) {
                globalThis.clearTimeout(markReadTimerRef.current);
            }

            markReadTimerRef.current = globalThis.setTimeout(async () => {
                try {
                    const { data } = await axios.post(
                        route('channels.read', selectedChannel.id),
                    );

                    emit('channel.read.updated', {
                        channel_id: data.channel_id,
                        user_id: Number(currentUser.id),
                        last_read_message_id: data.last_read_message_id ?? null,
                    });
                } catch {
                    lastScheduledReadIdRef.current = null;
                }
            }, 250);
        },
        [currentUser.id, emit, selectedChannel],
    );

    const syncReadState = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container || !selectedChannel) return;
        if (chatMessages.length === 0) return;

        const containerRect = container.getBoundingClientRect();
        let latestVisibleMessageId: number | null = null;
        const latestMessageId = chatMessages[0]?.id ?? null;

        for (const message of chatMessages) {
            const element = messageRefs.current.get(message.id);
            if (!element) continue;

            const rect = element.getBoundingClientRect();
            const isVisible =
                rect.bottom > containerRect.top && rect.top < containerRect.bottom;

            if (!isVisible) continue;

            if (
                latestVisibleMessageId == null ||
                message.id > latestVisibleMessageId
            ) {
                latestVisibleMessageId = message.id;
            }
        }

        if (latestVisibleMessageId !== latestMessageId) return;

        scheduleMarkAsRead(latestVisibleMessageId);
    }, [chatMessages, scheduleMarkAsRead, scrollContainerRef, selectedChannel]);

    const handleMessageCreated = useCallback(
        (message: ChatMessage) => {
            if (!selectedChannel || message.channel_id !== selectedChannel.id)
                return;

            addMessage(message);
            requestAnimationFrame(syncReadState);
        },
        [selectedChannel, addMessage, syncReadState],
    );

    const handleMessageDeleted = useCallback(
        ({ message }: MessageDeletedEvent) => {
            if (!selectedChannel || message.channel_id !== selectedChannel.id)
                return;
            markMessageDeleted(message);
        },
        [selectedChannel, markMessageDeleted],
    );

    const handleMessagesCleared = useCallback(
        ({ channel_id }: MessagesClearedEvent) => {
            if (!selectedChannel || channel_id !== selectedChannel.id) return;
            clearMessages();
        },
        [clearMessages, selectedChannel],
    );

    const handleReply = useCallback((message: ChatMessage) => {
        setReplyTo(message);
    }, []);

    const handleScroll = useCallback(() => {
        handleChatScroll();
        syncReadState();
    }, [handleChatScroll, syncReadState]);

    useEffect(() => {
        syncReadState();
    }, [syncReadState, selectedChannel?.id]);

    useEffect(() => {
        const offCreated = on('message.created', handleMessageCreated);
        const offDeleted = on('message.deleted', handleMessageDeleted);
        const offCleared = on('messages.cleared', handleMessagesCleared);

        return () => {
            offCreated();
            offDeleted();
            offCleared();
        };
    }, [on, handleMessageCreated, handleMessageDeleted, handleMessagesCleared]);

    if (!messages) {
        return (
            <EmptyState message="Please select a channel to start chatting" />
        );
    }

    return (
        <>
            <div className="flex h-full flex-col">
                <ChannelHeader channel={selectedChannel} />

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
                                    ref={(element) => {
                                        if (element) {
                                            messageRefs.current.set(
                                                message.id,
                                                element,
                                            );
                                            return;
                                        }

                                        messageRefs.current.delete(message.id);
                                    }}
                                    className="transition-all duration-200 ease-out"
                                >
                                    <MessageItem
                                        message={message}
                                        isOwnMessage={
                                            message.sender_id === myId
                                        }
                                        onReply={handleReply}
                                        onAttachmentClick={open}
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
                            <div ref={triggerRef} />
                        </>
                    )}
                </div>

                {selectedChannel ? (
                    <div className="px-2 pb-1">
                        <TypingIndicator
                            channelName={`message.channel.${selectedChannel.id}`}
                            userId={String(currentUser.id)}
                            userName={currentUser.name}
                            userAvatarUrl={currentUser.avatar_url}
                            className="mb-2"
                        />
                    </div>
                ) : null}

                <MessageInput
                    channel={selectedChannel}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                />
            </div>

            {preview?.attachments && (
                <AttachmentPreviewModal
                    key={preview.startIndex}
                    index={preview.startIndex}
                    isShow={isOpen}
                    onClose={close}
                    attachments={preview.attachments}
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
