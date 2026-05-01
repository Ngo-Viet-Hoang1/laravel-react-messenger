import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { useEffect, useRef, useState } from 'react';
import ConversationHeader from '../Components/App/ConversationHeader';
import MessageInput from '../Components/App/MessageInput';
import MessageItem from '../Components/App/MessageItem';

export default function Home({ messages, selectedConversation }) {
    const [localMessages, setLocalMessages] = useState([]);
    const messageCtrRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            if (!messageCtrRef.current) {
                return;
            }
            messageCtrRef.current.scrollTop =
                messageCtrRef.current.scrollHeight;
        }, 10);
    }, [selectedConversation]);

    useEffect(() => {
        setLocalMessages(messages ? messages.data.reverse() : []);
    }, [messages]);

    const onMessageSent = (message) => {
        setLocalMessages((prev) => [...prev, message]);
        setTimeout(() => {
            if (!messageCtrRef.current) {
                return;
            }
            messageCtrRef.current.scrollTop =
                messageCtrRef.current.scrollHeight;
        }, 10);
    };

    return (
        <>
            {!messages && (
                <div className="flex h-full flex-col items-center justify-center gap-8 text-center opacity-35">
                    <div className="p-16 text-2xl text-slate-200 md:text-4xl">
                        Please select conversation to see messages
                    </div>
                    <ChatBubbleLeftRightIcon className="inline-block h-32 w-32" />
                </div>
            )}
            {messages && (
                <>
                    <ConversationHeader
                        selectedConversation={selectedConversation}
                    />
                    <div
                        ref={messageCtrRef}
                        className="flex-1 overflow-y-auto py-5"
                    >
                        {/*Messages*/}

                        {localMessages.length === 0 && (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-lg text-slate-200">
                                    No messages yet
                                </div>
                            </div>
                        )}
                        {localMessages.length > 0 && (
                            <div className="flex flex-1 flex-col">
                                {localMessages.map((message) => (
                                    <MessageItem
                                        key={message.id}
                                        message={message}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <MessageInput
                        conversation={selectedConversation}
                        onMessageSent={onMessageSent}
                    />
                </>
            )}
        </>
    );
}

Home.layout = (page) => {
    return (
        <AuthenticatedLayout user={page.props.auth.user}>
            <ChatLayout children={page} />
        </AuthenticatedLayout>
    );
};
