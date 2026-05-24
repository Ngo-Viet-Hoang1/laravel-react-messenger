import { Menu, MenuButton, Transition } from '@headlessui/react';
import {
    LockClosedIcon,
    LockOpenIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@heroicons/react/16/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Fragment } from 'react';
import { useEventBus } from '../../EventBus';

export default function UserOptionsDropdown({ conversation }) {
    const { emit } = useEventBus();
    const changeUserRole = () => {
        console.log('Change user role');
        if (!conversation.is_user) {
            return;
        }

        axios
            .post(route('user.changeRole', conversation.id))
            .then((res) => {
                emit('toast', res.data.message);
                console.log(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const onBlockUser = () => {
        console.log('Block user');
        if (!conversation.is_user) {
            return;
        }

        axios
            .post(route('user.blockUnblock', conversation.id))
            .then((res) => {
                emit('toast', res.data.message);
                console.log(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <div>
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <MenuButton className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/40">
                        <EllipsisVerticalIcon className="h-5 w-5" />
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
                    <Menu.Items className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-gray-800 shadow-lg">
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onBlockUser}
                                        className={`${active ? 'bg-black/30 text-white' : 'text-gray-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                        {conversation.blocked_at && (
                                            <>
                                                <LockOpenIcon className="mr-2 h-4 w-4" />
                                                Unblock User
                                            </>
                                        )}
                                        {!conversation.blocked_at && (
                                            <>
                                                <LockClosedIcon className="mr-2 h-4 w-4" />
                                                Block User
                                            </>
                                        )}
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={changeUserRole}
                                        className={`${active ? 'bg-black/30 text-white' : 'text-gray-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                        {conversation.is_admin && (
                                            <>
                                                <UserIcon className="mr-2 h-4 w-4" />
                                                Make regular User
                                            </>
                                        )}
                                        {!conversation.is_admin && (
                                            <>
                                                <ShieldCheckIcon className="mr-2 h-4 w-4" />
                                                Make Admin
                                            </>
                                        )}
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    );
}
