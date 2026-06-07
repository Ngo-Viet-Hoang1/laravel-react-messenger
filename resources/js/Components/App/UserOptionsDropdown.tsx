import { useConfirm } from '@/Contexts/ConfirmContext';
import { useUserModal } from '@/Contexts/UserModalContext';
import { useEventBus } from '@/EventBus';
import { ChatItem, User } from '@/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
    EllipsisHorizontalIcon,
    EllipsisVerticalIcon,
    LockClosedIcon,
    LockOpenIcon,
    PencilIcon,
    ShieldCheckIcon,
    UserIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type Props = {
    channel?: ChatItem;
    user?: User;
    mode?: 'chat' | 'table';
};

const UserOptionsDropdown = ({ channel, user, mode = 'chat' }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const { emit } = useEventBus();
    const { openModal } = useUserModal();
    const confirmDialog = useConfirm();

    // Resolve name, id, is_admin, and blocked_at regardless of whether we got channel or user
    const targetId = user ? user.id : (channel?.peer_user_id ?? 0);
    const targetName = user ? user.name : (channel?.name ?? '');
    const isAdmin = user ? user.is_admin : (channel?.peer_is_admin ?? false);
    const blockedAt = user ? user.blocked_at : (channel?.blocked_at ?? null);

    const executeAction = (actionRoute: string, successMessage: string) => {
        if (!targetId || isLoading) return;

        setIsLoading(true);
        router.patch(
            route(actionRoute, targetId),
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

    const handleBlock = async () => {
        const isConfirmed = await confirmDialog({
            title: 'Block User',
            message: `Block user "${targetName}"?`,
            isDanger: true,
            confirmText: 'Yes',
        });

        if (!isConfirmed) return;

        executeAction('users.block', `"${targetName}" has been blocked`);
    };

    const handleUnblock = () => {
        executeAction('users.unblock', `"${targetName}" has been unblocked`);
    };

    const handleToggleRole = () => {
        if (isAdmin) {
            executeAction('users.demote', `"${targetName}" is no longer an admin`);
        } else {
            executeAction('users.promote', `"${targetName}" is now an admin`);
        }
    };

    const menuItemClassName =
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors disabled:opacity-40 data-[focus]:bg-slate-100 data-[focus]:text-slate-800 dark:text-slate-200 dark:data-[focus]:bg-slate-700/70 dark:data-[focus]:text-slate-100';

    const buttonClassName = mode === 'chat'
        ? 'focus-visible:ring-phthalogreen-500 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 opacity-0 transition-all hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 group-hover:pointer-events-auto group-hover:bg-white/5 group-hover:opacity-100 group-hover:shadow-sm group-hover:shadow-slate-900/10 group-hover:backdrop-blur-sm data-[open]:pointer-events-auto data-[open]:bg-white/5 data-[open]:opacity-100 data-[open]:shadow-sm data-[open]:shadow-slate-900/10 data-[open]:backdrop-blur-sm dark:text-slate-300 dark:hover:text-slate-100 dark:group-hover:bg-slate-700/10 dark:group-hover:shadow-black/10 dark:data-[open]:bg-slate-700/10 dark:data-[open]:shadow-black/10'
        : 'flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100';

    return (
        <Menu
            as="div"
            className={mode === 'chat' ? 'group absolute right-2 top-1/2 z-20 -translate-y-1/2' : 'relative inline-block text-left'}
        >
            <MenuButton disabled={isLoading} className={buttonClassName}>
                {isLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : mode === 'chat' ? (
                    <EllipsisHorizontalIcon className="h-5 w-5" />
                ) : (
                    <EllipsisVerticalIcon className="h-5 w-5" />
                )}
            </MenuButton>

            <MenuItems
                transition
                className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-slate-700 dark:bg-slate-800"
            >
                {mode === 'table' && user && (
                    <MenuItem>
                        <button
                            type="button"
                            onClick={() => openModal(user)}
                            disabled={isLoading}
                            className={menuItemClassName}
                        >
                            <PencilIcon className="h-4 w-4" />
                            Edit Info
                        </button>
                    </MenuItem>
                )}

                <MenuItem>
                    <button
                        type="button"
                        onClick={blockedAt ? handleUnblock : handleBlock}
                        disabled={isLoading}
                        className={menuItemClassName}
                    >
                        {blockedAt ? (
                            <>
                                <LockOpenIcon className="h-4 w-4" />
                                {mode === 'chat' ? 'Unblock User' : 'Unblock'}
                            </>
                        ) : (
                            <>
                                <LockClosedIcon className={`h-4 w-4 ${mode === 'table' ? 'text-red-500' : ''}`} />
                                <span className={mode === 'table' ? 'text-red-600 dark:text-red-400' : ''}>
                                    {mode === 'chat' ? 'Block User' : 'Block'}
                                </span>
                            </>
                        )}
                    </button>
                </MenuItem>

                <MenuItem>
                    <button
                        type="button"
                        onClick={handleToggleRole}
                        disabled={isLoading}
                        className={menuItemClassName}
                    >
                        {isAdmin ? (
                            <>
                                <UserIcon className="h-4 w-4" />
                                {mode === 'chat' ? 'Make Regular User' : 'Demote to User'}
                            </>
                        ) : (
                            <>
                                {mode === 'chat' ? <UserPlusIcon className="h-4 w-4" /> : <ShieldCheckIcon className="h-4 w-4" />}
                                {mode === 'chat' ? 'Make Admin' : 'Promote to Admin'}
                            </>
                        )}
                    </button>
                </MenuItem>
            </MenuItems>
        </Menu>
    );
};

export default UserOptionsDropdown;
