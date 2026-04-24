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
    const messagesCtrRef = useRef<HTMLDivElement>(null);
    const { on } = useEventBus();

    const messageCreated = useCallback(
        (message: ChatMessage) => {
            if (!selectedConversation) return;
            if (
                !isMessageForConversation(message, selectedConversation, myId)
            ) {
                return;
            }
            const isMessageAlreadyAdded = localMessages.some(
                (m) => m.id === message.id,
            );
            if (isMessageAlreadyAdded) return;

            setLocalMessages((prev) => [...prev, message]);
        },
        [selectedConversation, myId, localMessages],
    );

    useEffect(() => {
        const offCreated = on('message.created', messageCreated);
        return () => offCreated();
    }, [messageCreated, on]);

    useEffect(() => {
        if (!messagesCtrRef.current) return;

        const timeoutId = window.setTimeout(() => {
            messagesCtrRef.current?.scrollTo({
                top: messagesCtrRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }, 100);

        return () => window.clearTimeout(timeoutId);
    }, [
        localMessages.length,
        selectedConversation?.id,
        selectedConversation?.is_group,
    ]);

    useEffect(() => {
        setLocalMessages(messages?.data ? [...messages.data].reverse() : []);
    }, [messages]);

    if (!messages) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-2xl font-semibold opacity-35">
                <ChatBubbleLeftRightIcon className="h-16 w-16" />
                Please select a conversation to start chatting
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <ConversationHeader selectedConversation={selectedConversation} />

            <div ref={messagesCtrRef} className="flex-1 overflow-y-auto p-2">
                {localMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-2xl font-semibold opacity-35">
                        <ChatBubbleLeftRightIcon className="h-16 w-16" />
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col">
                        {localMessages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
                    </div>
                )}
            </div>

            <MessageInput conversation={selectedConversation} />
        </div>
    );
}

Home.layout = (page: React.ReactNode) => (
    <AuthenticatedLayout>
        <ChatLayout>{page}</ChatLayout>
    </AuthenticatedLayout>
);

export default Home;
