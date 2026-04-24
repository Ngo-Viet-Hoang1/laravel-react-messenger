import { ChatMessage, PageProps } from '@/types';
import { formatChatTime } from '@/utils/chatTime.util';
import { usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import UserAvatar from './UserAvatar';

type Props = {
    message: ChatMessage;
};

const DELETED_USER = { name: 'Deleted User', avatar_url: null };

const MessageItem = ({ message }: Props) => {
    const currentUser = usePage<PageProps>().props.auth.user;
    const isOwnMessage = message.sender_id === currentUser.id;
    const sender = message.sender ?? DELETED_USER;
    const senderName = sender.name;
    const formattedTime = formatChatTime(message.created_at);

    return (
        <div className={`chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}>
            <div className="chat-image">
                <UserAvatar user={sender} />
            </div>

            <div className="chat-header flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                className={`chat-bubble relative max-w-[82%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${
                    isOwnMessage
                        ? 'chat-bubble-info text-white'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
                }`}
            >
                <div className="chat-message">
                    <div className="chat-message-content">
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {message.message ?? ''}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
