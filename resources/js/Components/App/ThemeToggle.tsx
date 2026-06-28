import { useTheme } from '@/hooks/useTheme';
import {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    Transition,
} from '@headlessui/react';
import {
    CheckIcon,
    ComputerDesktopIcon,
    MoonIcon,
    SunIcon,
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';

const options = [
    { value: 'light' as const, label: 'Sáng', Icon: SunIcon },
    { value: 'dark' as const, label: 'Tối', Icon: MoonIcon },
    { value: 'system' as const, label: 'Hệ thống', Icon: ComputerDesktopIcon },
];

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const CurrentIcon = options.find((o) => o.value === theme)?.Icon ?? SunIcon;

    return (
        <Menu as="div" className="relative">
            <MenuButton className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                <CurrentIcon className="h-4 w-4" />
            </MenuButton>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <MenuItems className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-900">
                    {options.map(({ value, label, Icon }) => (
                        <MenuItem key={value}>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme(value)}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 ${active ? 'bg-gray-100 dark:bg-gray-800' : ''} `}
                                >
                                    <Icon className="h-4 w-4 shrink-0 opacity-60" />
                                    <span className="flex-1 text-left">
                                        {label}
                                    </span>
                                    {theme === value && (
                                        <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                </button>
                            )}
                        </MenuItem>
                    ))}
                </MenuItems>
            </Transition>
        </Menu>
    );
}

export default ThemeToggle;
