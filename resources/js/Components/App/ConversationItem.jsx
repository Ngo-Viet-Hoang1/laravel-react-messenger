import { formatMessageDateShort } from '@/helpers';
import { Link, usePage } from '@inertiajs/react';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';
import UserOptionsDropdow from './UserOptionsDropdown';

const ConversationItem = ({
    conversation,
    selectedConversation = null,
    online = null,
}) => {
    const page = usePage();
    const currentUser = page.props.auth.user;
    let classes = 'border-transparent';
    if (selectedConversation) {
        if (
            !selectedConversation.is_group &&
            !conversation.is_group &&
            selectedConversation.id == conversation.id
        ) {
            classes = 'border-blue-500 bg-black/20';
        }
        if (
            selectedConversation.is_group &&
            conversation.is_group &&
            selectedConversation.id == conversation.id
        ) {
            classes = 'border-blue-500 bg-black/20';
        }
    }
    return (
        <Link
            href={
                conversation.is_group
                    ? route('chat.group', conversation)
                    : route('chat.user', conversation)
            }
            preserveState
            className={
                'conversation-item flex cursor-pointer items-center gap-2 border-l-4 p-2 text-gray-300 transition-all hover:bg-black/30' +
                classes +
                (conversation.is_user && currentUser.is_admin
                    ? ' pr-2'
                    : ' pr-4')
            }
        >
            {conversation.is_user && (
                <UserAvatar user={conversation} online={online} />
            )}
            {conversation.is_group && <GroupAvatar />}
            <div
                className={
                    `max-w-full flex-1 overflow-hidden text-xs ` +
                    (conversation.is_user && conversation.blocked_at
                        ? ' opacity-50'
                        : '')
                }
            >
                <div className="flex items-center justify-between gap-1">
                    <h3 className="overflow-hidden text-ellipsis text-nowrap text-sm font-semibold">
                        {conversation.name}
                    </h3>
                    {conversation.last_message_date && (
                        <span className="text-nowrap">
                            {formatMessageDateShort(
                                conversation.last_message_date,
                            )}
                        </span>
                    )}
                </div>
                {conversation.last_message && (
                    <p className="overflow-hidden text-ellipsis text-nowrap text-xs">
                        {conversation.last_message}
                    </p>
                )}
            </div>
            {!!currentUser.is_admin && conversation.is_user && (
                <UserOptionsDropdow conversation={conversation} />
            )}
        </Link>
    );
};

export default ConversationItem;
