import { ChatItem } from '@/types';
import { formatChatTime } from '../../utils/chatTime.util';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';
import UserOptionsDropdown from './UserOptionsDropdown';

type Props = {
    channel: ChatItem;
    online: boolean;
    isSelected?: boolean;
    canManage?: boolean;
    onSelect: (channelId: number) => void;
};

const ChannelItem = ({
    channel,
    online,
    isSelected = false,
    canManage = false,
    onSelect,
}: Props) => {
    const isDirectChannel = channel.type === 'direct';
    const formattedTime = formatChatTime(channel.last_message_date);
    const unreadCount = channel.unread_count ?? 0;
    const hasUnread = unreadCount > 0 && !isSelected;
    const unreadLabel =
        unreadCount > 9
            ? '9+ tin nhắn chưa đọc'
            : `${unreadCount} tin nhắn chưa đọc`;

    const rowClassName =
        'conversation-item group relative flex items-center gap-2 border-l-4 px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100/90 dark:text-slate-200 dark:hover:bg-slate-700/50 ' +
        (isSelected
            ? 'border-indigo-500 bg-indigo-50/80 dark:border-indigo-400 dark:bg-slate-700/70'
            : 'border-transparent');

    const textBlockClassName =
        'min-w-0 max-w-full flex-1 overflow-hidden text-xs ' +
        (isDirectChannel && channel.blocked_at ? 'opacity-60' : '');

    const handleClick = (e: React.MouseEvent): void => {
        e.preventDefault();
        if (isSelected) return;
        onSelect(channel.id);
    };

    return (
        <div className={rowClassName}>
            <button
                type="button"
                onClick={handleClick}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
            >
                {isDirectChannel ? (
                    <UserAvatar user={channel} online={online} />
                ) : (
                    <GroupAvatar />
                )}

                <div className={textBlockClassName}>
                    <div className="flex min-w-0 items-center gap-2">
                        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {channel.name}
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

                    {(channel.last_message || hasUnread) && (
                        <div className="mt-0.5 flex min-w-0 items-center gap-2">
                            {channel.last_message && (
                                <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                    {channel.last_message}
                                </p>
                            )}

                            {hasUnread && (
                                <span
                                    className="badge badge-primary h-5 min-w-5 shrink-0 rounded-full px-1.5 text-[11px] font-semibold leading-none"
                                    aria-label={unreadLabel}
                                    title={unreadLabel}
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </button>

            {canManage && isDirectChannel && (
                <UserOptionsDropdown channel={channel} />
            )}
        </div>
    );
};

export default ChannelItem;
