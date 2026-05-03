/* global route */

import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';
import ConversationHeader from '@/Components/App/ConversationHeader';
import MessageInput from '@/Components/App/MessageInput';
import MessageItem from '@/Components/App/MessageItem';
import { useEventBus } from '@/EventBus';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

function Home({ selectedConversation = null, messages = null }) {

    const [localMessages, setLocalMessages] = useState([]);
    const [srollFromBottom, setScrollFromBottom] = useState(null);
    const [noMoreMessages, setNoMoreMessages] = useState(false);
    const isLoadingMoreMessages = useRef(false);
    const messageCtrRef = useRef(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState({
        attachments: [],
        index: 0,
    });
    const loadMoreIntersect = useRef(null);
    const { on } = useEventBus();

    const loadMoreMessages = useCallback(() => {

        if (noMoreMessages || isLoadingMoreMessages.current) {
            return;
        }

        const firstMessage = localMessages[0];
        if (!firstMessage) {
            return;
        }

        isLoadingMoreMessages.current = true;

        axios.get(route('message.loadOlder', firstMessage.id))
            .then(({ data }) => {
                if (data.data.length === 0) {
                    setNoMoreMessages(true);
                    return;
                }

                const scrollHeight = messageCtrRef.current.scrollHeight;
                const scrollTop = messageCtrRef.current.scrollTop;
                const clientHeight = messageCtrRef.current.clientHeight;
                const tmpScrollFromBottom = scrollHeight - scrollTop - clientHeight;
                console.log(tmpScrollFromBottom)
                setScrollFromBottom(scrollHeight - scrollTop - clientHeight);

                setLocalMessages((prevMessages) => [...data.data.reverse(), ...prevMessages]);
            })
            .finally(() => {
                isLoadingMoreMessages.current = false;
            })

    }, [localMessages, noMoreMessages]);

    const onAttachmentClick = (attachments, index) => {
        setPreviewAttachment({ attachments, index });
        setShowAttachmentPreview(true);
    }

    const messageCreated = useCallback((message) => {
        if (!selectedConversation) {
            return;
        }

        const selectedId = Number(selectedConversation.id);
        const senderId = Number(message.sender_id);
        const receiverId = Number(message.receiver_id);
        const groupId = Number(message.group_id);

        const isCurrentGroupMessage = selectedConversation.is_group
            && selectedId === groupId;

        const isCurrentUserMessage = selectedConversation.is_user
            && (selectedId === senderId || selectedId === receiverId);

        if (!isCurrentGroupMessage && !isCurrentUserMessage) {
            return;
        }

        setLocalMessages((prevMessages) => {
            if (prevMessages.some((existingMessage) => existingMessage.id === message.id)) {
                return prevMessages;
            }

            return [...prevMessages, message];
        });
    }, [selectedConversation]);

    const messageDeleted = useCallback((payload) => {
        const deletedMessage = payload?.message;
        if (!deletedMessage) {
            return;
        }

        setLocalMessages((prevMessages) =>
            prevMessages.filter((m) => Number(m.id) !== Number(deletedMessage.id))
        );
    }, []);

    useEffect(() => {
        setTimeout(() => {
            if (messageCtrRef.current) {
                messageCtrRef.current.scrollTop = messageCtrRef.current.scrollHeight;
            }
        }, 10);

        const offCreated = on("message.created", messageCreated);
        const offDeleted = on("message.deleted", messageDeleted);

        setScrollFromBottom(0);
        setNoMoreMessages(false);

        return () => {
            offCreated();
            offDeleted();
        }

    }, [selectedConversation, messageCreated, messageDeleted, on]);

    useEffect(() => {
        setLocalMessages(messages ? [...messages.data].reverse() : []);
    }, [messages]);

    useEffect(() => {
        if (messageCtrRef.current && srollFromBottom !== null) {
            messageCtrRef.current.scrollTop = messageCtrRef.current.scrollHeight
                - messageCtrRef.current.offsetHeight
                - srollFromBottom;
        }

        if (noMoreMessages) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => entry.isIntersecting && loadMoreMessages()
                ),
            {
                rootMargin: '0px 0px 250px 0px',
            }
        );
        if (loadMoreIntersect.current) {
            setTimeout(() => {
                observer.observe(loadMoreIntersect.current);
            }, 100);
        }

        return () => {
            observer.disconnect();
        };
    }, [localMessages, loadMoreMessages, noMoreMessages, srollFromBottom]);

    return (
        <>
            {!messages && (
                <div className='flex flex-col gap-8 justify-center items-center text-center h-full opacity-35'>
                    <div className='text-2xl md:text-4xl p-16 text-slate-200'>
                        Please select conversation to see message
                    </div>
                    <ChatBubbleLeftRightIcon className='w-32 h-32 inline-block' />
                </div>
            )}
            {messages && (
                <>
                    <ConversationHeader
                        selectedConversation={selectedConversation}
                    />
                    <div ref={messageCtrRef} className='flex-1 overflow-y-auto p-5'>

                        {localMessages.length === 0 && (
                            <div className='flex justify-center items-center h-full'>
                                <div className='text-lg text-slate-200'>
                                    No messages found
                                </div>
                            </div>
                        )}
                        {localMessages.length > 0 && (
                            <div className='flex flex-col flex-1'>
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
                    <MessageInput conversation={selectedConversation} />
                </>
            )}
            {previewAttachment.attachments.length > 0 && (
                <AttachmentPreviewModal
                    attachments={previewAttachment.attachments}
                    index={previewAttachment.index}
                    show={showAttachmentPreview}
                    onClose={() => setShowAttachmentPreview(false)}
                />
            )}
        </>
    );
}

Home.layout = (page) => {
    return (
        <AuthenticatedLayout user={page.props.auth.user} >
            <ChatLayout>{page}</ChatLayout>
        </AuthenticatedLayout>
    );
}

export default Home;