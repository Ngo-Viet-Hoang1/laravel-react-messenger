import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';
import ConversationHeader from '@/Components/App/ConversationHeader';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
import { useEventBus } from '@/EventBus';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import {
    PageProps as AppPageProps,
    ChatItem,
    ChatMessage,
    ChatMessageCollection,
    MessageAttachment,
} from '@/types';
import { isMessageForConversation } from '@/utils';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type PageProps = {
    selectedConversation?: ChatItem | null;
    messages?: ChatMessageCollection | null;
};

function Home({ selectedConversation = null, messages = null }: PageProps) {
    const currentUser = usePage<AppPageProps>().props.auth.user;
    const myId = Number(currentUser.id);

    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const [isShowAttachmentPreview, setIsShowAttachmentPreview] =
        useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<{
        id: number;
        attachments: MessageAttachment[];
    } | null>(null);

    const messagesCtrRef = useRef<HTMLDivElement>(null);
    const isUserNearBottomRef = useRef(true);
    const { on } = useEventBus();

    const messageCreated = useCallback(
        (message: ChatMessage) => {
            if (!selectedConversation) return;
            if (
                !isMessageForConversation(message, selectedConversation, myId)
            ) {
                return;
            }

            setLocalMessages((prev) =>
                prev.some((m) => m.id === message.id)
                    ? prev
                    : [...prev, message],
            );
        },
        [selectedConversation, myId],
    );

    useEffect(() => {
        const offCreated = on('message.created', messageCreated);
        return () => offCreated();
    }, [messageCreated, on]);

    const handleScroll = useCallback(() => {
        if (!messagesCtrRef.current) return;
        const container = messagesCtrRef.current;
        isUserNearBottomRef.current =
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
            150;
    }, []);

    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'smooth') => {
            if (messagesCtrRef.current) {
                messagesCtrRef.current.scrollTo({
                    top: messagesCtrRef.current.scrollHeight,
                    behavior,
                });
            }
        },
        [],
    );

    useEffect(() => {
        if (isUserNearBottomRef.current || localMessages.length <= 10) {
            requestAnimationFrame(() => scrollToBottom('smooth'));
        }
    }, [localMessages.length, selectedConversation?.id, scrollToBottom]);

    useEffect(() => {
        const container = messagesCtrRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            if (isUserNearBottomRef.current) {
                scrollToBottom('auto');
            }
        });

        if (container.firstElementChild) {
            resizeObserver.observe(container.firstElementChild);
        }

        return () => resizeObserver.disconnect();
    }, [selectedConversation?.id, scrollToBottom]);

    const handleAttachmentClick = (
        attachments: MessageAttachment[],
        index: number,
    ) => {
        setPreviewAttachment({ id: index, attachments });
        setIsShowAttachmentPreview(true);
    };

    useEffect(() => {
        setLocalMessages(messages?.data ? [...messages.data].reverse() : []);
    }, [messages]);

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-2xl font-semibold opacity-35">
            <ChatBubbleLeftRightIcon className="h-16 w-16" />
            {message}
        </div>
    );

    if (!messages) {
        return (
            <EmptyState message="Please select a conversation to start chatting" />
        );
    }

    return (
        <>
            <div className="flex h-full flex-col">
                <ConversationHeader
                    selectedConversation={selectedConversation}
                />

                <div
                    ref={messagesCtrRef}
                    className="flex flex-1 flex-col overflow-y-auto p-2"
                    onScroll={handleScroll}
                >
                    {localMessages.length === 0 ? (
                        <EmptyState message="No messages yet. Start the conversation!" />
                    ) : (
                        <div className="flex shrink-0 flex-col">
                            {localMessages.map((message) => (
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
                    key={`${previewAttachment.id}_${isShowAttachmentPreview}`}
                    index={previewAttachment.id}
                    isShow={isShowAttachmentPreview}
                    onClose={() => setIsShowAttachmentPreview(false)}
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

export default Home;
