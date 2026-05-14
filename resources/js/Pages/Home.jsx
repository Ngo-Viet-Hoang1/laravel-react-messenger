import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import AttachmentPreviewModal from '../Components/App/AttachmentPreviewModal';
import ConversationHeader from '../Components/App/ConversationHeader';
import MessageInput from '../Components/App/MessageInput';
import MessageItem from '../Components/App/MessageItem';
import { useEventBus } from '../EventBus';

export default function Home({ messages, selectedConversation }) {
    const [localMessages, setLocalMessages] = useState([]);
    const loadMoreIntersect = useRef(null);
    const [noMoreMessages, setNoMoreMessages] = useState(false);
    const [scrollFromBottom, setScrollFromBottom] = useState(null);
    const messageCtrRef = useRef(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState([]);
    const { on } = useEventBus();

    const loadMoreMessages = useCallback(() => {
        if (noMoreMessages) {
            return;
        }

        const firstMessage = localMessages[0];
        axios
            .get(route('message.loadOlder', firstMessage.id))
            .then(({ data }) => {
                if (data.messages.data.length === 0) {
                    setNoMoreMessages(true);
                    return;
                }

                const scrollHeight = messageCtrRef.current.scrollHeight;
                const scrollTop = messageCtrRef.current.scrollTop;
                const clientHeight = messageCtrRef.current.clientHeight;
                const tmpScrollBottom = scrollHeight - scrollTop - clientHeight;
                console.log('tmpScrollBottom', tmpScrollBottom);
                setScrollFromBottom(tmpScrollBottom);

                setLocalMessages((prevMessages) => {
                    return [...data.messages.data.reverse(), ...prevMessages];
                });
            });
    }, [localMessages, noMoreMessages]);

    const messageCreated = (message) => {
        if (
            selectedConversation &&
            selectedConversation.is_group &&
            selectedConversation.id === message.group_id
        ) {
            setLocalMessages((prevMessages) => [...prevMessages, message]);
        }

        if (
            selectedConversation &&
            selectedConversation.is_user &&
            (selectedConversation.id === message.sender_id ||
                selectedConversation.id === message.receiver_id)
        ) {
            setLocalMessages((prevMessages) => [...prevMessages, message]);
        }
    };

    const onAttachmentClick = (attachments, ind) => {
        setPreviewAttachment({ attachments, ind });
        setShowAttachmentPreview(true);
    };

    useEffect(() => {
        setTimeout(() => {
            if (!messageCtrRef.current) {
                return;
            }
            messageCtrRef.current.scrollTop =
                messageCtrRef.current.scrollHeight;
        }, 10);

        const offCreated = on('message.created', messageCreated);

        setScrollFromBottom(0);
        setNoMoreMessages(false);

        return () => {
            offCreated();
        };
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

    useEffect(() => {
        if (messageCtrRef.current && setScrollFromBottom !== null) {
            messageCtrRef.current.scrollTop =
                messageCtrRef.current.scrollHeight -
                scrollFromBottom -
                messageCtrRef.current.offsetHeight;
        }

        if (noMoreMessages) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach(
                    (entry) => entry.isIntersecting && loadMoreMessages(),
                ),
            {
                rootMargin: '0px 0px 250px 0px',
            },
        );

        if (loadMoreIntersect.current) {
            setTimeout(() => {
                observer.observe(loadMoreIntersect.current);
            }, 100);
        }

        return () => {
            observer.disconnect();
        };
    }, [localMessages]);

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
                                <div ref={loadMoreIntersect}></div>
                                {localMessages.map((message) => (
                                    <MessageItem
                                        key={message.id}
                                        message={message}
                                        attachmentClick={onAttachmentClick}
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

            {previewAttachment.attachments && (
                <AttachmentPreviewModal
                    attachments={previewAttachment.attachments}
                    index={previewAttachment.ind}
                    show={showAttachmentPreview}
                    onClose={() => setShowAttachmentPreview(false)}
                />
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
