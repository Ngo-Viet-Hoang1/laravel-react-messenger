import { Menu, MenuButton, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Fragment } from 'react';
import { useEventBus } from '../../EventBus';

export default function MessageOptionsDropdown({ message }) {
    const { emit } = useEventBus();

    const onMessageDelete = () => {
        console.log('Delete message');

        axios
            .delete(route('message.destroy', message.id))
            .then((res) => {
                emit('message.deleted', {
                    message,
                    prevMessage: res.data.message,
                });
                console.log(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <div className="absolute right-full top-1/2 z-10 -translate-y-1/2 text-gray-100">
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
                    <Menu.Items className="absolute left-0 z-50 mt-2 w-48 rounded-md bg-gray-800 shadow-lg">
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onMessageDelete}
                                        className={`${active ? 'bg-black/30 text-white' : 'text-gray-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete Message
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
