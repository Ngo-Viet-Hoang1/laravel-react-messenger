import { type ChatMember, type MessageReactionGroup } from '@/types';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useMemo } from 'react';

type Props = {
    reactions: MessageReactionGroup[];
    currentUserId: number;
    channelUsers?: ChatMember[];
};

const MessageReactions = ({
    reactions,
    currentUserId,
    channelUsers = [],
}: Props) => {
    if (!reactions || reactions.length === 0) return null;

    const totalCount = useMemo(
        () => reactions.reduce((sum, g) => sum + g.count, 0),
        [reactions],
    );

    const getUserName = (userId: number): string => {
        const user = channelUsers.find((u) => u.id === userId);
        if (user) return userId === currentUserId ? 'You' : user.name;
        return userId === currentUserId ? 'You' : `User #${userId}`;
    };

    return (
        <Popover className="relative">
            <PopoverButton
                as="button"
                type="button"
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                }}
                className="inline-flex items-center gap-0.5 rounded-full bg-slate-700 px-1.5 py-0.5 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-slate-600 active:scale-95 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
                {reactions.map((group) => (
                    <span
                        key={group.emoji}
                        className="text-xs leading-none"
                    >
                        {group.emoji}
                    </span>
                ))}
                {totalCount > 1 && (
                    <span className="text-[10px] font-medium leading-none text-slate-200">
                        {totalCount}
                    </span>
                )}
            </PopoverButton>

            <PopoverPanel
                anchor="top"
                className="z-50 mb-1 w-48 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
                {reactions.map((group) => (
                    <div key={group.emoji} className="mb-2 last:mb-0">
                        <div className="mb-1 text-center text-sm">
                            {group.emoji} {group.count}
                        </div>
                        <ul className="max-h-24 space-y-0.5 overflow-y-auto">
                            {group.user_ids.map((userId) => (
                                <li
                                    key={userId}
                                    className="truncate rounded-md px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300"
                                >
                                    {getUserName(userId)}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </PopoverPanel>
        </Popover>
    );
};

export default MessageReactions;
