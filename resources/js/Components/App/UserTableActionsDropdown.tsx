import { useConfirm } from '@/Contexts/ConfirmContext';
import { useUserModal } from '@/Contexts/UserModalContext';
import { useEventBus } from '@/EventBus';
import { User } from '@/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
    EllipsisVerticalIcon,
    LockClosedIcon,
    LockOpenIcon,
    PencilIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type Props = {
    user: User;
};

export default function UserTableActionsDropdown({ user }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const { emit } = useEventBus();
    const { openModal } = useUserModal();
    const confirmDialog = useConfirm();

    const handleEdit = (): void => {
        openModal(user);
    };

    const handleBlock = async (): Promise<void> => {
        if (isLoading) return;

        const isConfirmed = await confirmDialog({
            title: 'Block User',
            message: `Block user "${user.name}"?`,
            isDanger: true,
            confirmText: 'Yes',
        });

        if (!isConfirmed) return;

        setIsLoading(true);
        router.patch(
            route('users.block', user.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    emit('toast.show', `"${user.name}" has been blocked`);
                    setIsLoading(false);
                },
                onError: () => setIsLoading(false),
            }
        );
    };

    const handleUnblock = (): void => {
        if (isLoading) return;

        setIsLoading(true);
        router.patch(
            route('users.unblock', user.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    emit('toast.show', `"${user.name}" has been unblocked`);
                    setIsLoading(false);
                },
                onError: () => setIsLoading(false),
            }
        );
    };

    const handlePromote = (): void => {
        if (isLoading) return;

        setIsLoading(true);
        router.patch(
            route('users.promote', user.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    emit('toast.show', `"${user.name}" is now an admin`);
                    setIsLoading(false);
                },
                onError: () => setIsLoading(false),
            }
        );
    };

    const handleDemote = (): void => {
        if (isLoading) return;

        setIsLoading(true);
        router.patch(
            route('users.demote', user.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    emit('toast.show', `"${user.name}" is no longer an admin`);
                    setIsLoading(false);
                },
                onError: () => setIsLoading(false),
            }
        );
    };

    const menuItemClassName =
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors disabled:opacity-40 data-[focus]:bg-slate-100 data-[focus]:text-slate-800 dark:text-slate-200 dark:data-[focus]:bg-slate-700/70 dark:data-[focus]:text-slate-100';

    return (
        <Menu as="div" className="relative inline-block text-left">
            <MenuButton
                disabled={isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
                {isLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : (
                    <EllipsisVerticalIcon className="h-5 w-5" />
                )}
            </MenuButton>

            <MenuItems
                transition
                className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-slate-700 dark:bg-slate-800"
            >
                <MenuItem>
                    <button
                        type="button"
                        onClick={handleEdit}
                        disabled={isLoading}
                        className={menuItemClassName}
                    >
                        <PencilIcon className="h-4 w-4" />
                        Edit Info
                    </button>
                </MenuItem>

                {user.blocked_at ? (
                    <MenuItem>
                        <button
                            type="button"
                            onClick={handleUnblock}
                            disabled={isLoading}
                            className={menuItemClassName}
                        >
                            <LockOpenIcon className="h-4 w-4" />
                            Unblock
                        </button>
                    </MenuItem>
                ) : (
                    <MenuItem>
                        <button
                            type="button"
                            onClick={handleBlock}
                            disabled={isLoading}
                            className={menuItemClassName}
                        >
                            <LockClosedIcon className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 dark:text-red-400">Block</span>
                        </button>
                    </MenuItem>
                )}

                {user.is_admin ? (
                    <MenuItem>
                        <button
                            type="button"
                            onClick={handleDemote}
                            disabled={isLoading}
                            className={menuItemClassName}
                        >
                            <UserIcon className="h-4 w-4" />
                            Demote to User
                        </button>
                    </MenuItem>
                ) : (
                    <MenuItem>
                        <button
                            type="button"
                            onClick={handlePromote}
                            disabled={isLoading}
                            className={menuItemClassName}
                        >
                            <ShieldCheckIcon className="h-4 w-4" />
                            Promote to Admin
                        </button>
                    </MenuItem>
                )}
            </MenuItems>
        </Menu>
    );
}
