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

                        {channel.unread_count ? (
                            <span className="badge badge-primary badge-sm text-[10px] font-semibold">
                                {channel.unread_count > 9
                                    ? '9+'
                                    : channel.unread_count}
                            </span>
                        ) : null}

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

                    {channel.last_message && (
                        <p className="mt-0.5 min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
                            {channel.last_message}
                        </p>
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
