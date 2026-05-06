import { ChatMessage, MessageAttachment, PageProps } from '@/types';
import { formatChatTime } from '@/utils/chatTime.util';
import { usePage } from '@inertiajs/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import MessageAttachments from './MessageAttachments';
import MessageOptionsDropdown from './MessageOptionsDropdown';
import UserAvatar from './UserAvatar';

type Props = {
    message: ChatMessage;
    onAttachmentClick?: (
        attachments: MessageAttachment[],
        index: number,
    ) => void;
};

const DELETED_USER = { name: 'Deleted User', avatar_url: null };

const MessageItem = ({ message, onAttachmentClick }: Props) => {
    const currentUser = usePage<PageProps>().props.auth.user;
    const isOwnMessage = message.sender_id === currentUser.id;
    const sender = message.sender ?? DELETED_USER;
    const senderName = sender.name;
    const formattedTime = formatChatTime(message.created_at);

    return (
        <div
            className={`group chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}
        >
            <div className="avatar chat-image">
                {isOwnMessage ? null : <UserAvatar user={sender} />}
            </div>

            <div className="chat-header mb-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {isOwnMessage ? 'You' : senderName}
                </span>

                {formattedTime && (
                    <time
                        dateTime={formattedTime.dateTime}
                        title={formattedTime.tooltip}
                        className="opacity-80"
                    >
                        {formattedTime.label}
                    </time>
                )}
            </div>

            <div
                className={`chat-bubble relative rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[70%] ${
                    isOwnMessage
                        ? 'chat-bubble-info text-white'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
                }`}
            >
                {isOwnMessage && (
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2">
                        <MessageOptionsDropdown message={message} />
                    </div>
                )}

                <div className="chat-message flex flex-col gap-1.5">
                    <div className="chat-message-content prose-sm dark:prose-invert prose max-w-none text-current">
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {message.message ?? ''}
                        </ReactMarkdown>
                    </div>
                    <MessageAttachments
                        attachments={message.attachments}
                        onAttachmentClick={onAttachmentClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(MessageItem);
