import { ChatMessage, PageProps } from '@/types';
import { formatChatTime } from '@/utils/chatTime.util';
import { usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import UserAvatar from './UserAvatar';

type Props = {
    message: ChatMessage;
};

const MessageItem = ({ message }: Props) => {
    const currentUser = usePage<PageProps>().props.auth.user;
    const isOwnMessage = message.sender_id === currentUser.id;
    const senderName = message.sender?.name ?? 'Unknown user';

    const formattedTime = formatChatTime(message.created_at);

    return (
        <div className={`chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}>
            <div className="chat-image">
                <UserAvatar user={message.sender} />
            </div>

            <div className="chat-header flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {isOwnMessage ? 'You' : senderName}
                </span>

                <time
                    dateTime={formattedTime?.dateTime}
                    title={formattedTime?.tooltip}
                    className="opacity-80"
                >
                    {formattedTime?.label}
                </time>
            </div>

            <div
                className={`chat-bubble relative max-w-[82%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${isOwnMessage ? 'chat-bubble-info text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'}`}
            >
                <div className="chat-message">
                    <div className="chat-message-content">
                        <ReactMarkdown>{message.message ?? ''}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
