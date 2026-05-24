import { useEventBus } from '@/EventBus';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Fragment } from 'react';

export default function MessageOptionDropdown({ message }) {
    const { emit } = useEventBus();

    const onMessageDelete = () => {
        axios
            .delete(route('messages.destroy', message.id))
            .then((res) => {
                emit('message.deleted', {
                    message,
                    prevMessage:
                        res.data.prevMessage ?? res.data.message ?? null,
                });
            })
            .catch((err) => {
                console.log('err', err);
            });
    };

    return (
        <div className="absolute right-full top-1/2 -translate-y-1/2 text-gray-100">
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/40">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                    </Menu.Button>
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
                    <Menu.Items className="absolute left-0 z-[100] mt-2 w-48 rounded-md bg-gray-800 shadow-lg">
                        <div className="px-1 py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onMessageDelete}
                                        className={`${
                                            active
                                                ? 'bg-black/30 text-white'
                                                : 'text-gray-100'
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete
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
