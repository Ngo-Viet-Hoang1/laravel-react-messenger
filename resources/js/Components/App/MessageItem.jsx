import { usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import { formatMessageDateLong } from '../../helpers';
import MessageAttachments from './MessageAttachments';
import UserAvatar from './UserAvatar';

const MessageItem = ({ message, attachmentClick }) => {
    const currentUser = usePage().props.auth.user;

    return (
        <div
            className={
                'chat ' +
                (Number(message.sender_id) === Number(currentUser.id)
                    ? 'chat-end'
                    : 'chat-start')
            }
        >
            <div className="chat-image">
                <UserAvatar user={message.sender} />
            </div>

            <div className="chat-header">
                {Number(message.sender_id) !== Number(currentUser.id)
                    ? message.sender.name
                    : ''}
                <time className="ml-2 text-xs opacity-50">
                    {formatMessageDateLong(message.created_at)}
                </time>
            </div>

            <div
                className={
                    'chat-bubble relative ' +
                    (Number(message.sender_id) === Number(currentUser.id)
                        ? ' chat-bubble-info'
                        : '')
                }
            >
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
