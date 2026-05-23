import { Popover, Transition } from '@headlessui/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { Fragment } from 'react';
import UserAvatar from './UserAvatar';

export default function GroupUsersPopover({
    group = null,
    currentUser = null,
}) {
    const conversations = usePage().props.conversations || [];
    const usersById = new Map(
        conversations
            .filter((c) => c.is_user)
            .map((user) => [Number(user.id), user]),
    );

    if (!group) {
        return null;
    }

    const normalizedUsers = (group.users ?? []).map((user) => {
        if (user && typeof user === 'object') {
            return user;
        }
        const userId = Number(user);
        if (currentUser?.id && Number(currentUser.id) === userId) {
            return currentUser;
        }
        const lookup = usersById.get(userId);
        if (lookup) {
            return lookup;
        }
        return { id: userId, name: `User ${userId}` };
    });

    const shouldIncludeSelf =
        currentUser?.id &&
        (Number(currentUser.id) === Number(group.owner_id) ||
            (group.users ?? []).some(
                (user) => Number(user?.id ?? user) === Number(currentUser.id),
            ));

    if (shouldIncludeSelf) {
        normalizedUsers.push(currentUser);
    }

    const uniqueUsers = Array.from(
        new Map(
            normalizedUsers
                .filter((user) => user?.id)
                .map((user) => [Number(user.id), user]),
        ).values(),
    );

    return (
        <Popover className="relative">
            {({ open }) => (
                <>
                    <Popover.Button
                        className={`rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${open ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                    >
                        <div className="flex items-center gap-1 text-gray-500">
                            <UsersIcon className="height-6 w-6" />
                            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-700">
                                {uniqueUsers.length}
                            </span>
                        </div>
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-50 mt-2 w-72 max-w-xs transform px-3 sm:px-0">
                            <div className="overflow-hidden rounded-xl bg-slate-800 shadow-lg ring-1 ring-black/40">
                                <div className="max-height-60 custom-scrollbar overflow-y-auto">
                                    {uniqueUsers.map((user) => (
                                        <Link
                                            href={route('chat.user', user.id)}
                                            key={user.id}
                                            className="conversation-item border-1-4 flex items-center gap-3 p-2 text-gray-300 transition-all hover:bg-black/30"
                                        >
                                            <UserAvatar user={user} />
                                            <div className="min-w-0 max-w-full flex-1 overflow-hidden text-xs">
                                                <h3 className="overflow-hidden text-ellipsis text-nowrap text-sm font-semibold">
                                                    {user.name ||
                                                        `User ${user.id}`}
                                                    {user.id ===
                                                        currentUser?.id && (
                                                        <span className="ml-1 text-xs text-gray-400">
                                                            (You)
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
