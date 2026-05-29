import { ChatMessage, MessageAttachment } from '@/types';
import { formatChatTime } from '@/utils/chatTime.util';
import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import MessageAttachments from './MessageAttachments';
import MessageOptionsDropdown from './MessageOptionsDropdown';
import UserAvatar from './UserAvatar';

type Props = {
    message: ChatMessage;
    isOwnMessage?: boolean;
    onAttachmentClick?: (
        attachments: MessageAttachment[],
        index: number,
    ) => void;
};

const DELETED_USER = { name: 'Deleted User', avatar_url: null };

const markdownComponents: Components = {
    pre: ({ className, children, ...props }) => (
        <pre
            className={`whitespace-pre-wrap break-words overflow-x-hidden ${className ?? ''}`}
            style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
            }}
            {...props}
        >
            {children}
        </pre>
    ),
    code: ({ className, children, ...props }) => (
        <code
            className={`break-words ${className ?? ''}`}
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            {...props}
        >
            {children}
        </code>
    ),
};

const MessageItem = ({ message, isOwnMessage, onAttachmentClick }: Props) => {
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
                    <div className="chat-message-content prose prose-sm max-w-none break-words text-current dark:prose-invert">
                        <ReactMarkdown
                            rehypePlugins={[rehypeSanitize]}
                            components={markdownComponents}
                        >
                            {message.content ?? ''}
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
