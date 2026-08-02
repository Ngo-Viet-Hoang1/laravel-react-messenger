import { ChatItem, User } from '@/types';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import GroupAvatar from './GroupAvatar';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from './UserAvatar';

type Props = {
    channels: ChatItem[];
    users: User[];
    isLoading: boolean;
    onSelectChannel: (channelId: number) => void;
    onSelectUser: (userId: number) => void;
};

const INITIAL_LIMIT = 5;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="sticky top-0 z-10 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:bg-slate-800/90 dark:text-slate-500">
        {children}
    </div>
);

const ShowMoreButton = ({
    totalCount,
    isExpanded,
    onClick,
}: {
    totalCount: number;
    isExpanded: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-indigo-500 transition-colors hover:bg-indigo-50/60 dark:text-indigo-400 dark:hover:bg-slate-700/40"
    >
        {isExpanded ? (
            <>
                Show less
                <ChevronUpIcon className="h-3.5 w-3.5" />
            </>
        ) : (
            <>
                Show all {totalCount} results
                <ChevronDownIcon className="h-3.5 w-3.5" />
            </>
        )}
    </button>
);

const UserSearchResults = ({
    channels,
    users,
    isLoading,
    onSelectChannel,
    onSelectUser,
}: Props) => {
    const [channelsExpanded, setChannelsExpanded] = useState(false);
    const [usersExpanded, setUsersExpanded] = useState(false);

    // Reset expanded state when results change (new query)
    useEffect(() => {
        setChannelsExpanded(false);
    }, [channels]);

    useEffect(() => {
        setUsersExpanded(false);
    }, [users]);

    const hasChannels = channels.length > 0;
    const hasUsers = users.length > 0;
    const showEmpty = !isLoading && !hasChannels && !hasUsers;

    const visibleChannels = channelsExpanded
        ? channels
        : channels.slice(0, INITIAL_LIMIT);
    const visibleUsers = usersExpanded ? users : users.slice(0, INITIAL_LIMIT);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {/* Matched channels */}
            {hasChannels && (
                <>
                    <SectionLabel>Channels · {channels.length}</SectionLabel>
                    {visibleChannels.map((channel) => (
                        <button
                            key={`ch-${channel.id}`}
                            type="button"
                            onClick={() => onSelectChannel(channel.id)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-indigo-50 dark:hover:bg-slate-700/60"
                        >
                            {channel.type === 'direct' ? (
                                <UserAvatar user={channel} />
                            ) : (
                                <GroupAvatar />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                    {channel.name}
                                </p>
                                {channel.last_message && (
                                    <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                                        {channel.last_message}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                    {channels.length > INITIAL_LIMIT && (
                        <ShowMoreButton
                            totalCount={channels.length}
                            isExpanded={channelsExpanded}
                            onClick={() => setChannelsExpanded((prev) => !prev)}
                        />
                    )}
                </>
            )}

            {/* Users from API */}
            {hasUsers && (
                <>
                    <SectionLabel>Users · {users.length}</SectionLabel>
                    {visibleUsers.map((user) => (
                        <button
                            key={`u-${user.id}`}
                            type="button"
                            onClick={() => onSelectUser(user.id)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-indigo-50 dark:hover:bg-slate-700/60"
                        >
                            <UserAvatar user={user} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                    {user.name}
                                </p>
                                <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                                    {user.email}
                                </p>
                            </div>
                        </button>
                    ))}
                    {users.length > INITIAL_LIMIT && (
                        <ShowMoreButton
                            totalCount={users.length}
                            isExpanded={usersExpanded}
                            onClick={() => setUsersExpanded((prev) => !prev)}
                        />
                    )}
                </>
            )}

            {/* Loading */}
            {isLoading && !hasUsers && (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-400">
                    <LoadingSpinner size="sm" />
                    Searching users…
                </div>
            )}

            {/* Empty state */}
            {showEmpty && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No results found
                </div>
            )}
        </div>
    );
};

export default UserSearchResults;
