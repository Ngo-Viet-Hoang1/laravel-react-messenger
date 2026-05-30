import { useTheme } from '@/hooks/useTheme';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { Theme } from 'emoji-picker-react';
import React, { Suspense, useMemo } from 'react';

const loadEmojiPicker = () => import('emoji-picker-react');
const LazyEmojiPicker = React.lazy(loadEmojiPicker);

type Props = {
    disabled?: boolean;
    onSelect: (emoji: string) => void;
};

const triggerClassName =
    'btn btn-circle btn-ghost inline-flex h-8 min-h-8 w-8 items-center justify-center p-0 text-slate-500 transition-all duration-150 hover:scale-[1.04] hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-slate-600';

export default function EmojiPickerPopover({
    disabled = false,
    onSelect,
}: Props) {
    const { theme } = useTheme();
    const isDarkTheme = useMemo(() => {
        return (
            theme === 'dark' ||
            (theme === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
        );
    }, [theme]);
    const pickerTheme = isDarkTheme ? Theme.DARK : Theme.LIGHT;

    return (
        <Popover className="relative z-50">
            {({ close }) => (
                <>
                    <PopoverButton
                        type="button"
                        disabled={disabled}
                        onMouseEnter={loadEmojiPicker}
                        className={triggerClassName}
                    >
                        <FaceSmileIcon className="h-5 w-5" />
                    </PopoverButton>

                    <PopoverPanel
                        anchor="top end"
                        className="z-50 mb-2 w-[22rem] max-w-[calc(100vw-1rem)] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                    >
                        <Suspense fallback={<div className="h-[320px]" />}>
                            <LazyEmojiPicker
                                theme={pickerTheme}
                                onEmojiClick={(emojiData) => {
                                    onSelect(emojiData.emoji);
                                    close();
                                }}
                            />
                        </Suspense>
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
}
