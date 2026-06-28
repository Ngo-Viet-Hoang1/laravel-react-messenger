import { ChatMember } from '@/types';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import UserAvatar from './UserAvatar';

type Props = {
    users: ChatMember[] | null | undefined;
};

const GroupUsersPopover = ({ users }: Props) => {
    return (
        <Popover className="relative">
            <PopoverButton className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 focus:outline-none dark:text-slate-400 dark:hover:text-slate-200">
                <UsersIcon className="h-3.5 w-3.5" />
                {users ? `${users.length} members` : 'No members'}
            </PopoverButton>

            <PopoverPanel
                transition
                anchor="bottom start"
                className="z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl transition duration-200 ease-out data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-slate-700 dark:bg-slate-800"
            >
                <div className="flex max-h-64 flex-col overflow-y-auto p-1">
                    {users?.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() =>
                                router.post(route('channels.direct', user.id))
                            }
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        >
                            <div className="shrink-0">
                                <UserAvatar user={user} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {user.name}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </PopoverPanel>
        </Popover>
    );
};

export default GroupUsersPopover;
