import { ChatItem } from '@/types';
import {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    Transition,
} from '@headlessui/react';
import {
    EllipsisHorizontalIcon,
    LockClosedIcon,
    LockOpenIcon,
    UserIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { Fragment } from 'react';

const UserOptionsDropdown = ({ conversation }: { conversation: ChatItem }) => {
    const changeUserRole = async () => {
        if (!conversation.is_user) return;

        try {
            const res = await axios.post(
                route('user.changeRole', conversation.id),
            );
            console.log(res.data);
        } catch (error) {
            console.error('Error changing user role:', error);
        }
    };

    const onBlockUser = async () => {
        if (!conversation.is_user) return;

        try {
            const res = await axios.post(
                route('user.blockUnblock', conversation.id),
            );
            console.log(res.data);
        } catch (error) {
            console.error('Error toggling block status:', error);
        }
    };

    return (
        <Menu
            as="div"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2"
        >
            {({ open }) => (
                <>
                    <div
                        className={`rounded-full transition-all ${
                            open
                                ? 'bg-white/5 shadow-sm shadow-slate-900/10 backdrop-blur-sm dark:bg-slate-700/10 dark:shadow-black/10'
                                : 'group-hover:bg-white/5 group-hover:shadow-sm group-hover:shadow-slate-900/10 group-hover:backdrop-blur-sm dark:group-hover:bg-slate-700/10 dark:group-hover:shadow-black/10'
                        }`}
                    >
                        <MenuButton
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-opacity hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:text-slate-100 ${
                                open
                                    ? 'opacity-100'
                                    : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
                            }`}
                        >
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                        </MenuButton>
                    </div>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <MenuItems className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg focus:outline-none dark:border-slate-700 dark:bg-slate-800">
                            <MenuItem>
                                {({ active }) => (
                                    <button
                                        type="button"
                                        onClick={onBlockUser}
                                        className={`${
                                            active
                                                ? 'bg-slate-100 text-slate-800 dark:bg-slate-700/70 dark:text-slate-100'
                                                : 'text-slate-600 dark:text-slate-200'
                                        } flex w-full items-center rounded-lg px-2 py-2 text-sm transition-colors`}
                                    >
                                        {conversation.blocked_at ? (
                                            <>
                                                <LockOpenIcon className="mr-2 h-4 w-4" />
                                                Unblock User
                                            </>
                                        ) : (
                                            <>
                                                <LockClosedIcon className="mr-2 h-4 w-4" />
                                                Block User
                                            </>
                                        )}
                                    </button>
                                )}
                            </MenuItem>

                            <MenuItem>
                                {({ active }) => (
                                    <button
                                        type="button"
                                        onClick={changeUserRole}
                                        className={`${
                                            active
                                                ? 'bg-slate-100 text-slate-800 dark:bg-slate-700/70 dark:text-slate-100'
                                                : 'text-slate-600 dark:text-slate-200'
                                        } flex w-full items-center rounded-lg px-2 py-2 text-sm transition-colors`}
                                    >
                                        {conversation.is_admin ? (
                                            <>
                                                <UserIcon className="mr-2 h-4 w-4" />
                                                Make Regular User
                                            </>
                                        ) : (
                                            <>
                                                <UserPlusIcon className="mr-2 h-4 w-4" />
                                                Make Admin
                                            </>
                                        )}
                                    </button>
                                )}
                            </MenuItem>
                        </MenuItems>
                    </Transition>
                </>
            )}
        </Menu>
    );
};

export default UserOptionsDropdown;
