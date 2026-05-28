import { useEventBus } from '@/EventBus';
import { ChatItem } from '@/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
    EllipsisHorizontalIcon,
    LockClosedIcon,
    LockOpenIcon,
    UserIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const UserOptionsDropdown = ({ channel }: { channel: ChatItem }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { emit } = useEventBus();

    const executeAction = (actionRoute: string, successMessage: string) => {
        if (channel.type !== 'direct' || !channel.peer_user_id || isLoading)
            return;

        setIsLoading(true);
        router.patch(
            route(actionRoute, channel.peer_user_id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    emit('toast.show', successMessage);
                    setIsLoading(false);
                },
                onError: () => setIsLoading(false),
            },
        );
    };

    return (
        <Menu
            as="div"
            className="group absolute right-2 top-1/2 z-20 -translate-y-1/2"
        >
            <MenuButton
                disabled={isLoading}
                className="focus-visible:ring-phthalogreen-500 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 opacity-0 transition-all hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 group-hover:pointer-events-auto group-hover:bg-white/5 group-hover:opacity-100 group-hover:shadow-sm group-hover:shadow-slate-900/10 group-hover:backdrop-blur-sm data-[open]:pointer-events-auto data-[open]:bg-white/5 data-[open]:opacity-100 data-[open]:shadow-sm data-[open]:shadow-slate-900/10 data-[open]:backdrop-blur-sm dark:text-slate-300 dark:hover:text-slate-100 dark:group-hover:bg-slate-700/10 dark:group-hover:shadow-black/10 dark:data-[open]:bg-slate-700/10 dark:data-[open]:shadow-black/10"
            >
                {isLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : (
                    <EllipsisHorizontalIcon className="h-5 w-5" />
                )}
            </MenuButton>

            <MenuItems
                transition
                className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-slate-700 dark:bg-slate-800"
            >
                <MenuItem>
                    <button
                        type="button"
                        onClick={() =>
                            channel.blocked_at
                                ? executeAction(
                                      'users.unblock',
                                      `${channel.name} has been unblocked`,
                                  )
                                : executeAction(
                                      'users.block',
                                      `${channel.name} has been blocked`,
                                  )
                        }
                        disabled={isLoading}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition-colors disabled:opacity-40 data-[focus]:bg-slate-100 data-[focus]:text-slate-800 dark:text-slate-200 dark:data-[focus]:bg-slate-700/70 dark:data-[focus]:text-slate-100"
                    >
                        {channel.blocked_at ? (
                            <>
                                <LockOpenIcon className="h-4 w-4" />
                                Unblock User
                            </>
                        ) : (
                            <>
                                <LockClosedIcon className="h-4 w-4" />
                                Block User
                            </>
                        )}
                    </button>
                </MenuItem>

                <MenuItem>
                    <button
                        type="button"
                        onClick={() =>
                            channel.peer_is_admin
                                ? executeAction(
                                      'users.demote',
                                      `${channel.name} is no longer an admin`,
                                  )
                                : executeAction(
                                      'users.promote',
                                      `${channel.name} is now an admin`,
                                  )
                        }
                        disabled={isLoading}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition-colors disabled:opacity-40 data-[focus]:bg-slate-100 data-[focus]:text-slate-800 dark:text-slate-200 dark:data-[focus]:bg-slate-700/70 dark:data-[focus]:text-slate-100"
                    >
                        {channel.peer_is_admin ? (
                            <>
                                <UserIcon className="h-4 w-4" />
                                Make Regular User
                            </>
                        ) : (
                            <>
                                <UserPlusIcon className="h-4 w-4" />
                                Make Admin
                            </>
                        )}
                    </button>
                </MenuItem>
            </MenuItems>
        </Menu>
    );
};

export default UserOptionsDropdown;
