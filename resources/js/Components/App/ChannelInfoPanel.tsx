import { useChannelModal } from '@/Contexts/ChannelModalContext';
import { ChatItem } from '@/types';
import {
    FolderIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';

type Props = {
    channel: ChatItem;
    online?: boolean;
    onClose: () => void;
    onSearchClick: () => void;
    onDeleteClick: () => void;
};

const ChannelInfoPanel = ({
    channel,
    online = false,
    onClose,
    onSearchClick,
    onDeleteClick,
}: Props) => {
    const { openModal } = useChannelModal();
    const isGroup = channel.type === 'group';

    return (
        <div className="flex h-full w-85 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    Details
                </h3>
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    onClick={onClose}
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                <div className="flex flex-col items-center text-center">
                    <div className="shrink-0 [&_.avatar_div]:h-20! [&_.avatar_div]:w-20! [&_.avatar_span]:text-3xl! [&_.avatar_svg]:h-10! [&_.avatar_svg]:w-10!">
                        {isGroup ? (
                            <GroupAvatar />
                        ) : (
                            <UserAvatar user={channel} online={online} />
                        )}
                    </div>

                    <h4 className="mt-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                        {channel.name}
                    </h4>
                </div>

                <div className="mt-6 flex items-center justify-center gap-6 border-b border-slate-100 pb-5 dark:border-slate-700/50">
                    <button
                        type="button"
                        onClick={onSearchClick}
                        className="group flex flex-col items-center gap-1 focus:outline-none"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:group-hover:bg-slate-600">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
                            Search
                        </span>
                    </button>

                    {isGroup && (
                        <button
                            type="button"
                            onClick={() => openModal(channel)}
                            className="group flex flex-col items-center gap-1 focus:outline-none"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:group-hover:bg-slate-600">
                                <PencilIcon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
                                Edit
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onDeleteClick}
                        className="group flex flex-col items-center gap-1 focus:outline-none"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors group-hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:group-hover:bg-red-900/30">
                            <TrashIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300">
                            Delete
                        </span>
                    </button>
                </div>

                <div className="mt-4 flex flex-col">
                    {isGroup && channel.users && (
                        <div className="collapse-arrow collapse rounded-none border-b border-slate-100 bg-transparent dark:border-slate-700/50">
                            <input type="checkbox" className="peer" />
                            <div className="collapse-title min-h-0 px-0 py-3 text-sm font-semibold text-slate-700 peer-checked:pb-1 dark:text-slate-300">
                                Members ({channel.users.length})
                            </div>
                            <div className="collapse-content px-0 pt-1 pb-3 text-xs text-slate-500 dark:text-slate-400">
                                <div className="max-h-50 space-y-2.5 overflow-y-auto pr-1">
                                    {channel.users.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <UserAvatar user={member} />
                                                <span className="max-w-37.5 truncate font-medium text-slate-700 dark:text-slate-300">
                                                    {member.name}
                                                </span>
                                            </div>
                                            {member.id === channel.owner_id && (
                                                <span className="rounded bg-violet-100 px-1 py-0.5 text-[9px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                                                    Owner
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="collapse-arrow collapse rounded-none border-b border-slate-100 bg-transparent dark:border-slate-700/50">
                        <input type="checkbox" className="peer" />
                        <div className="collapse-title min-h-0 px-0 py-3 text-sm font-semibold text-slate-700 peer-checked:pb-1 dark:text-slate-300">
                            Media & Files
                        </div>
                        <div className="collapse-content px-0 pt-1 pb-3 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col items-center py-4 text-center text-slate-400 dark:text-slate-500">
                                <FolderIcon className="mb-1 h-8 w-8 opacity-40" />
                                <span>No shared media</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ChannelInfoPanel);
