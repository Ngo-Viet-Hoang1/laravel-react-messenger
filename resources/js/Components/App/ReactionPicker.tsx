import { useTheme } from '@/hooks/useTheme';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { Theme } from 'emoji-picker-react';
import React, { Suspense, useMemo, useState } from 'react';

const loadEmojiPicker = () => import('emoji-picker-react');
const LazyEmojiPicker = React.lazy(loadEmojiPicker);

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

type Props = {
    onSelectEmoji: (emoji: string) => void;
};

const ReactionPicker = ({ onSelectEmoji }: Props) => {
    const { theme } = useTheme();
    const [showFullPicker, setShowFullPicker] = useState(false);

    const isDarkTheme = useMemo(() => {
        return (
            theme === 'dark' ||
            (theme === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
        );
    }, [theme]);

    const pickerTheme = isDarkTheme ? Theme.DARK : Theme.LIGHT;

    return (
        <Popover className="relative z-20 flex items-center">
            {({ close }) => (
                <>
                    <PopoverButton
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 opacity-0 transition-all hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100 data-[open]:opacity-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        aria-label="React to message"
                        title="React to message"
                        onMouseEnter={loadEmojiPicker}
                        onClick={() => setShowFullPicker(false)}
                    >
                        <FaceSmileIcon className="h-5 w-5" />
                    </PopoverButton>

                    <PopoverPanel
                        anchor="bottom end"
                        className="z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800"
                    >
                        {!showFullPicker ? (
                            <div className="flex items-center gap-0.5 p-1.5">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                            onSelectEmoji(emoji);
                                            close();
                                        }}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition-all duration-100 hover:scale-125 hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-700"
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setShowFullPicker(true)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all duration-100 hover:scale-110 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                    title="More emojis"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-5 w-5"
                                    >
                                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="p-2">
                                <Suspense
                                    fallback={<div className="h-[320px]" />}
                                >
                                    <LazyEmojiPicker
                                        theme={pickerTheme}
                                        onEmojiClick={(emojiData) => {
                                            onSelectEmoji(emojiData.emoji);
                                            close();
                                            setShowFullPicker(false);
                                        }}
                                    />
                                </Suspense>
                            </div>
                        )}
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
};

export default ReactionPicker;
