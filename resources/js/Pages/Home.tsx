import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';
import ChannelHeader from '@/Components/App/ChannelHeader';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
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
import { MessageDeletedEvent } from '@/types/events';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

type PageProps = {
    selectedChannel?: ChatItem | null;
    messages?: ChatMessageCollection | null;
};

function Home({ selectedChannel = null, messages = null }: PageProps) {
    const currentUser = usePage<AppPageProps>().props.auth.user;
    const myId = Number(currentUser.id);
    const { on } = useEventBus();
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

    const {
        chatMessages,
        isLoadingOlderMessages,
        hasLoadedAllMessages,
        firstMessageDate,
        addMessage,
        removeMessage,
        loadOlderMessages,
    } = useMessages(messages, selectedChannel);

    const {
        scrollContainerRef,
        isNearBottomRef,
        handleScroll,
        scrollToBottom,
    } = useChatScroll();

    const { triggerRef } = useInfiniteScroll(
        loadOlderMessages,
        hasLoadedAllMessages,
    );

    const { isOpen, preview, open, close } = useAttachmentsPreviewModal();

    useEffect(
        () => scrollToBottom('auto'),
        [selectedChannel?.id, scrollToBottom],
    );

    useEffect(() => {
        setReplyTo(null);
    }, [selectedChannel?.id]);

    const handleMessageCreated = useCallback(
        (message: ChatMessage) => {
            if (!selectedChannel || message.channel_id !== selectedChannel.id)
                return;

            const wasAdded = addMessage(message);
            const isOwnMessage = message.sender_id === myId;
            if (wasAdded && (isNearBottomRef.current || isOwnMessage)) {
                requestAnimationFrame(() => scrollToBottom('smooth'));
            }

            if (!isOwnMessage) {
                void axios.post(route('channels.read', selectedChannel.id));
            }
        },
        [myId, scrollToBottom, isNearBottomRef, selectedChannel, addMessage],
    );

    const handleMessageDeleted = useCallback(
        ({ message }: MessageDeletedEvent) => {
            if (!selectedChannel || message.channel_id !== selectedChannel.id)
                return;
            removeMessage(message);
        },
        [selectedChannel, removeMessage],
    );

    const handleReply = useCallback((message: ChatMessage) => {
        setReplyTo(message);
    }, []);

    useEffect(() => {
        const offCreated = on('message.created', handleMessageCreated);
        const offDeleted = on('message.deleted', handleMessageDeleted);

        return () => {
            offCreated();
            offDeleted();
        };
    }, [on, handleMessageCreated, handleMessageDeleted]);

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
