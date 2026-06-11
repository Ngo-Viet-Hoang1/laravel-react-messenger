import { type ChatMember, type ChatMessage, type MessageAttachment } from '@/types';
import { formatChatTime } from '@/utils/chatTime.util';
import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import CodeBlock from './CodeBlock';
import MessageAttachments from './MessageAttachments';
import MessageOptionsDropdown from './MessageOptionsDropdown';
import MessageReactions from './MessageReactions';
import ReactionPicker from './ReactionPicker';
import ReplyPreview from './ReplyPreview';
import UserAvatar from './UserAvatar';

type Props = {
    message: ChatMessage;
    isOwnMessage?: boolean;
    currentUserId: number;
    channelUsers?: ChatMember[];
    onReply?: (message: ChatMessage) => void;
    onReaction?: (messageId: number, emoji: string) => void;
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

const MessageItem = ({
    message,
    isOwnMessage,
    currentUserId,
    channelUsers = [],
    onReply,
    onReaction,
    onAttachmentClick,
}: Props) => {
    const sender = message.sender ?? DELETED_USER;
    const senderName = sender.name;
    const formattedTime = formatChatTime(message.created_at);
    const isDeleted = message.deleted_at != null;

    const handleReaction = (emoji: string): void => {
        onReaction?.(message.id, emoji);
    };

    return (
        <div
            className={`group chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}
        >
            {!isOwnMessage && (
                <div className="chat-image">
                    <UserAvatar user={sender} />
                </div>
            )}

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
                className={`chat-bubble relative px-3.5 py-2.5 shadow-sm sm:max-w-[70%] ${
                    isOwnMessage
                        ? 'chat-bubble-success text-white'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
                } ${!isDeleted && message.reactions?.length > 0 ? 'mb-3' : ''}`}
            >
                <div
                    className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5 ${
                        isOwnMessage ? '-left-20' : '-right-20'
                    }`}
                >
                    {!isDeleted && (
                        <ReactionPicker onSelectEmoji={handleReaction} />
                    )}
                    <MessageOptionsDropdown
                        message={message}
                        onReply={onReply}
                        isOwnMessage={isOwnMessage}
                    />
                </div>

                <div className="chat-message flex flex-col gap-1.5">
                    {message.parent ? (
                        <ReplyPreview message={message.parent} />
                    ) : null}

                    <div className="chat-message-content prose-sm dark:prose-invert prose max-w-none break-words text-current">
                        {isDeleted ? (
                            <span className="italic opacity-75">
                                Message has been deleted.
                            </span>
                        ) : (
                            <ReactMarkdown
                                rehypePlugins={REHYPE_PLUGINS}
                                components={markdownComponents}
                            >
                                {message.content ?? ''}
                            </ReactMarkdown>
                        )}
                    </div>
                    <MessageAttachments
                        attachments={isDeleted ? [] : message.attachments}
                        onAttachmentClick={onAttachmentClick}
                    />
                </div>

                {!isDeleted && message.reactions?.length > 0 && (
                    <div
                        className={`absolute -bottom-2.5 ${
                            isOwnMessage ? 'right-1' : 'left-1'
                        }`}
                    >
                        <MessageReactions
                            reactions={message.reactions}
                            currentUserId={currentUserId}
                            channelUsers={channelUsers}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(MessageItem);
