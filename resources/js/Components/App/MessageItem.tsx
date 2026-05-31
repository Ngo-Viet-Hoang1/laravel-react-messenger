import { ChatMessage, MessageAttachment } from '@/types';
import { formatChatTime } from '@/utils/chatTime.util';
import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import CodeBlock from './CodeBlock';
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
const REHYPE_PLUGINS = [rehypeSanitize];

const markdownComponents: Components = {
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children, ...props }) => {
        // react-markdown passes node — if parent is pre, it's a block
        const isBlock =
            !props.node?.position ||
            props.node.data?.meta !== undefined ||
            className?.startsWith('language-') ||
            // heuristic: if children contain newlines it's a block
            (typeof children === 'string' && children.includes('\n'));

        if (isBlock) {
            return <CodeBlock className={className}>{children}</CodeBlock>;
        }

        return (
            <CodeBlock inline className={className}>
                {children}
            </CodeBlock>
        );
    },
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
                    <div className="chat-message-content prose-sm dark:prose-invert prose max-w-none break-words text-current">
                        <ReactMarkdown
                            rehypePlugins={REHYPE_PLUGINS}
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
