import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

type Props = {
    description: string | null | undefined;
};

const GroupDescriptionPopover = ({ description }: Props) => {
    return (
        <Popover className="relative">
            <PopoverButton className="flex items-center text-slate-500 transition-colors hover:text-slate-700 focus:outline-none dark:text-slate-400 dark:hover:text-slate-200">
                <ExclamationCircleIcon className="h-4 w-4" />
            </PopoverButton>
            <PopoverPanel
                transition
                anchor="bottom start"
                className="z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl transition duration-200 ease-out data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-slate-700 dark:bg-slate-800"
            >
                <div className="p-3 text-sm text-slate-700 dark:text-slate-300">
                    {description || 'No description provided.'}
                </div>
            </PopoverPanel>
        </Popover>
    );
};

export default GroupDescriptionPopover;
