import { ChatItem } from '@/types';
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { Link } from '@inertiajs/react';
import React from 'react';
import GroupAvatar from './GroupAvatar';
import GroupDescriptionPopover from './GroupDescriptionPopover';
import GroupUsersPopover from './GroupUsersPopover';
import UserAvatar from './UserAvatar';

type Props = {
    channel?: ChatItem | null;
    online?: boolean;
    onInfoToggle?: () => void;
};

const ChannelHeader = ({ channel, online = false, onInfoToggle }: Props) => {
    return (
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex min-w-0 items-center gap-3">
                <Link
                    href={route('dashboard')}
                    className="inline-block rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:hidden dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>

                <div className="shrink-0">
                    {channel?.type === 'direct' ? (
                        <UserAvatar user={channel} online={online} />
                    ) : (
                        <GroupAvatar />
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                        {channel?.is_e2ee_enabled && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                <LockClosedIcon className="h-3 w-3" />
                                <span>End-to-end encrypted</span>
                            </div>
                        )}
                        <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">
                            {channel?.name}
                        </h3>
                    </div>

                    {channel?.type === 'group' && (
                        <div className="flex items-center gap-2">
                            <GroupUsersPopover users={channel?.users} />

                            {channel?.description && (
                                <GroupDescriptionPopover
                                    description={channel?.description}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {(channel?.type === 'group' || channel?.type === 'direct') && (
                <div className="ml-4 flex shrink-0 items-center">
                    <button
                        type="button"
                        onClick={onInfoToggle}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-slate-200 dark:focus:ring-slate-600"
                        title="Chi tiết"
                    >
                        <InformationCircleIcon className="h-7 w-7" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(ChannelHeader);
