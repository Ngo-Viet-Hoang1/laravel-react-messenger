import { formatMessageDateLong } from '@/helpers';
import { usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import MessageAttachments from './MessageAttachments';
import MessageOptionDropdown from './MessageOptionsDropdown';
import UserAvatar from './UserAvatar';

const MessageItem = ({ message, attachmentClick }) => {
    const currentUser = usePage().props.auth.user;
    const sender = message.sender;

    return (
        <div
            className={
                'chat' +
                (message.sender_id === currentUser.id
                    ? ' chat-end'
                    : ' chat-start')
            }
        >
            <UserAvatar user={sender} />

            <div className="chat-header">
                {message.sender_id !== currentUser.id ? sender?.name || '' : ''}
                <time className="ml-2 text-xs opacity-50">
                    {formatMessageDateLong(message.created_at)}
                </time>
            </div>

            <div
                className={
                    'chat-bubble relative' +
                    (message.sender_id === currentUser.id
                        ? ' chat-bubble-info'
                        : ' ')
                }
            >
                {message.sender_id === currentUser.id && (
                    <MessageOptionDropdown message={message} />
                )}
                <div className="chat-message">
                    <div className="chat-message-content">
                        <ReactMarkdown>{message.message}</ReactMarkdown>
                    </div>
                    <MessageAttachments
                        attachments={message.attachments}
                        attachmentClick={attachmentClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
