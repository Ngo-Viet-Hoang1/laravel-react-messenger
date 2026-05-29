import { useEventBus } from '@/EventBus';
import { ChatMessage } from '@/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const MessageOptionsDropdown = ({ message }: { message: ChatMessage }) => {
    const { emit } = useEventBus();

    const handleDeleteMessage = async () => {
        try {
            const { data } = await axios.delete(
                route('messages.destroy', message.id),
            );

            const newLastMessage = data?.newLastMessage ?? null;

            emit('message.deleted', { message, newLastMessage });
        } catch (error) {
            emit('toast.show', 'Failed to delete message');
        }
    };

    return (
        <Menu as="div" className="relative z-20 flex items-center">
            <MenuButton
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 opacity-0 transition-all hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100 data-[open]:opacity-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Message options"
                title="Message options"
            >
                <EllipsisHorizontalIcon className="h-5 w-5" />
            </MenuButton>

            <MenuItems
                transition
                anchor="bottom end"
                className="z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg transition duration-200 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-slate-700 dark:bg-slate-800"
            >
                <MenuItem>
                    <button
                        type="button"
                        onClick={handleDeleteMessage}
                        className="group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors data-[focus]:bg-red-50 data-[focus]:text-red-600 dark:text-slate-200 dark:data-[focus]:bg-red-500/10 dark:data-[focus]:text-red-400"
                    >
                        <TrashIcon className="mr-2.5 h-4 w-4" />
                        Delete Message
                    </button>
                </MenuItem>
            </MenuItems>
        </Menu>
    );
};

export default MessageOptionsDropdown;
