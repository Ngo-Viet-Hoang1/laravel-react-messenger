import { ChatItem, PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { formatChatTime } from '../../utils/chatTime.util';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';
import UserOptionsDropdown from './UserOptionsDropdown';

type Props = {
    conversation: ChatItem;
    online: boolean;
    selectedConversation: ChatItem | null;
};

const ConversationItem = ({
    conversation,
    online,
    selectedConversation = null,
}: Props) => {
    const { auth } = usePage<PageProps>().props;
    const currentUser = auth.user;
    const isUserConversation = conversation.is_user;

    const isSelectedConversation =
        selectedConversation?.id === conversation.id &&
        selectedConversation.is_group === conversation.is_group;

    const rowClassName =
        'conversation-item group relative flex items-center gap-2 border-l-4 px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100/90 dark:text-slate-200 dark:hover:bg-slate-700/50 ' +
        (isSelectedConversation
            ? 'border-indigo-500 bg-indigo-50/80 dark:border-indigo-400 dark:bg-slate-700/70'
            : 'border-transparent');

    const textBlockClassName =
        'min-w-0 max-w-full flex-1 overflow-hidden text-xs ' +
        (isUserConversation && conversation.blocked_at ? 'opacity-60' : '');

    const href = conversation.is_group
        ? route('chat.group', { group: conversation.id })
        : route('chat.user', { user: conversation.id });
    const formattedTime = formatChatTime(conversation.last_message_date);

    return (
        <div className={rowClassName}>
            <Link
                href={href}
                preserveState
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
            >
                {isUserConversation ? (
                    <UserAvatar user={conversation} online={online} />
                ) : (
                    <GroupAvatar />
                )}

                <div className={textBlockClassName}>
                    <div className="flex min-w-0 items-center gap-2">
                        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {conversation.name}
                        </h3>

                        {formattedTime && (
                            <time
                                dateTime={formattedTime.dateTime}
                                title={formattedTime.tooltip}
                                className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400"
                            >
                                {formattedTime.label}
                            </time>
                        )}
                    </div>

                    {conversation.last_message && (
                        <p className="mt-0.5 min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
                            {conversation.last_message}
                        </p>
                    )}
                </div>
            </Link>

            {currentUser.is_admin && isUserConversation && (
                <UserOptionsDropdown conversation={conversation} />
            )}
        </div>
    );
};

export default ConversationItem;
