import ActiveUploadsList from '@/Components/App/ActiveUploadsList';
import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';
import ChannelHeader from '@/Components/App/ChannelHeader';
import ChannelInfoPanel from '@/Components/App/ChannelInfoPanel';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
import MessageSearchPanel from '@/Components/App/MessageSearchPanel';
import TypingIndicator from '@/Components/App/TypingIndicator';
import { useConfirm } from '@/Contexts/ConfirmContext';
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
    MessageReactionGroup,
} from '@/types';
import {
    MessageDeletedEvent,
    MessageReactionUpdatedEvent,
} from '@/types/events';
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
    const [showSearch, setShowSearch] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<
        number | null
    >(null);
    const confirmDialog = useConfirm();
    const markReadTimerRef = useRef<ReturnType<
        typeof globalThis.setTimeout
    > | null>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const lastScheduledReadIdRef = useRef<number | null>(null);
    const highlightTimerRef = useRef<ReturnType<
        typeof globalThis.setTimeout
    > | null>(null);

    const {
        chatMessages,
        isLoadingOlderMessages,
        hasLoadedAllMessages,
        firstMessageDate,
        addMessage,
        markMessageDeleted,
        updateMessageReactions,
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
        setShowSearch(false);
        setShowInfo(false);
        lastScheduledReadIdRef.current = null;
    }, [selectedChannel?.id]);

    useEffect(() => {
        return () => {
            if (markReadTimerRef.current) {
                globalThis.clearTimeout(markReadTimerRef.current);
            }
            if (highlightTimerRef.current) {
                globalThis.clearTimeout(highlightTimerRef.current);
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
                rect.bottom > containerRect.top &&
                rect.top < containerRect.bottom;

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

    const handleReply = useCallback((message: ChatMessage) => {
        setReplyTo(message);
    }, []);

    const handleReaction = useCallback(
        async (messageId: number, emoji: string) => {
            try {
                const { data } = await axios.post<{
                    message_id: number;
                    channel_id: number;
                    reactions: MessageReactionGroup[];
                }>(route('messages.reactions.toggle', messageId), { emoji });

                updateMessageReactions(data.message_id, data.reactions);

                // Notify sidebar to bump channel to top
                emit('message.reaction.updated', {
                    message_id: data.message_id,
                    channel_id: data.channel_id,
                    reactions: data.reactions,
                });
            } catch {
                emit('toast.show', 'Failed to react to message');
            }
        },
        [emit, updateMessageReactions],
    );

    const handleReactionUpdated = useCallback(
        (event: MessageReactionUpdatedEvent) => {
            if (!selectedChannel || event.channel_id !== selectedChannel.id)
                return;
            updateMessageReactions(event.message_id, event.reactions);
        },
        [selectedChannel, updateMessageReactions],
    );

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
        const offReaction = on('message.reaction.updated', handleReactionUpdated);

        return () => {
            offCreated();
            offDeleted();
            offReaction();
        };
    }, [on, handleMessageCreated, handleMessageDeleted, handleReactionUpdated]);

    const handleInfoToggle = useCallback((): void => {
        setShowInfo((prev) => !prev);
        setShowSearch(false);
    }, []);

    const handleDeleteChannel = useCallback(async (): Promise<void> => {
        if (!selectedChannel) return;

        const isConfirmed = await confirmDialog({
            title:
                selectedChannel.type === 'direct'
                    ? 'Delete Chat'
                    : 'Delete Group',
            message:
                selectedChannel.type === 'direct'
                    ? 'Are you sure you want to delete this direct chat? This action cannot be undone.'
                    : 'Are you sure you want to delete this group? This action cannot be undone.',
            isDanger: true,
            confirmText: 'Yes, delete',
        });

        if (!isConfirmed) return;

        try {
            const { data } = await axios.delete(
                route('channels.destroy', selectedChannel.id),
            );
            emit(
                'toast.show',
                data.message ||
                    `The chat "${selectedChannel.name}" has been deleted`,
            );
        } catch {
            emit(
                'toast.show',
                `Failed to delete "${selectedChannel.name}". Please try again.`,
            );
        }
    }, [selectedChannel, confirmDialog, emit]);

    const handleSearchResultClick = useCallback(
        (messageId: number): void => {
            const element = messageRefs.current.get(messageId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedMessageId(messageId);

                if (highlightTimerRef.current) {
                    globalThis.clearTimeout(highlightTimerRef.current);
                }
                highlightTimerRef.current = globalThis.setTimeout(() => {
                    setHighlightedMessageId(null);
                }, 2000);
            } else {
                emit(
                    'toast.show',
                    'This message is not currently loaded. Scroll up to load older messages.',
                );
            }
        },
        [emit],
    );

    if (!messages) {
        return (
            <EmptyState message="Please select a channel to start chatting" />
        );
    }

    return (
        <div className="flex h-full w-full bg-transparent">
            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800">
                <ChannelHeader
                    channel={selectedChannel}
                    onInfoToggle={handleInfoToggle}
                />

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
                                    className={`transition-all duration-300 ease-out ${highlightedMessageId === message.id ? 'rounded-lg bg-blue-100/60 ring-2 ring-blue-400/50 dark:bg-blue-500/15 dark:ring-blue-500/30' : ''}`}
                                >
                                    <MessageItem
                                        message={message}
                                        isOwnMessage={
                                            message.sender_id === myId
                                        }
                                        currentUserId={myId}
                                        channelUsers={selectedChannel?.users}
                                        onReply={handleReply}
                                        onReaction={handleReaction}
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

                {selectedChannel && (
                    <ActiveUploadsList channelId={selectedChannel.id} />
                )}

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

            {showSearch && selectedChannel && (
                <>
                    <div className="w-2 shrink-0 bg-transparent" />
                    <MessageSearchPanel
                        channelId={selectedChannel.id}
                        onClose={() => setShowSearch(false)}
                        onResultClick={handleSearchResultClick}
                    />
                </>
            )}

            {showInfo && selectedChannel && (
                <>
                    <div className="w-2 shrink-0 bg-transparent" />
                    <ChannelInfoPanel
                        channel={selectedChannel}
                        onClose={() => setShowInfo(false)}
                        onSearchClick={() => {
                            setShowInfo(false);
                            setShowSearch(true);
                        }}
                        onDeleteClick={handleDeleteChannel}
                    />
                </>
            )}

            {preview?.attachments && (
                <AttachmentPreviewModal
                    key={preview.startIndex}
                    index={preview.startIndex}
                    isShow={isOpen}
                    onClose={close}
                    attachments={preview.attachments}
                />
            )}
        </div>
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
