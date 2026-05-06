import { type AttachedItem } from '@/types';
import { formatFileSize } from '@/utils';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import AttachmentMedia from './AttachmentMedia';

type Props = {
    items: AttachedItem[];
    onRemove: (index: number) => void;
};

const CARD_BASE_CLASSES =
    'group relative overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800';

const RemoveButton = ({
    onClick,
    variant = 'light',
}: {
    onClick: () => void;
    variant?: 'light' | 'dark';
}) => {
    const base =
        'absolute flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100';
    const variants = {
        light: 'right-2 top-2 bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400',
        dark: 'right-1.5 top-1.5 bg-slate-800/40 text-white backdrop-blur-sm hover:bg-slate-800/60',
    };

    return (
        <button
            type="button"
            aria-label="Remove item"
            onClick={onClick}
            className={`${base} ${variants[variant]}`}
        >
            <XMarkIcon className="h-4 w-4" />
        </button>
    );
};

const AttachedItemList = ({ items, onRemove }: Props) => {
    if (items.length === 0) return null;

    const mediaItems = items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.kind === 'image' || item.kind === 'video');

    const fileItems = items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.kind === 'file' || item.kind === 'audio');

    return (
        <div className="flex flex-col gap-3 px-1 pb-1">
            {/* ── Media Group (Images & Videos) ── */}
            {mediaItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {mediaItems.map(({ item, idx }) => (
                        <div
                            key={`${item.url}`}
                            className={`${CARD_BASE_CLASSES} h-32 w-32 sm:h-40 sm:w-40`}
                        >
                            <AttachmentMedia
                                url={item.url}
                                mime={item.mime}
                                name={item.name}
                                classNames={{
                                    image: 'h-full w-full object-cover',
                                    video: 'h-full w-full object-cover',
                                }}
                            />
                            <RemoveButton
                                onClick={() => onRemove(idx)}
                                variant="dark"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Files & Audio Group ── */}
            {fileItems.length > 0 && (
                <div className="flex flex-wrap items-start gap-2">
                    {fileItems.map(({ item, idx }) => (
                        <div
                            key={`${item.url}`}
                            className={`${CARD_BASE_CLASSES} ${
                                item.kind === 'audio'
                                    ? 'flex max-w-xs flex-col justify-center gap-1.5 p-3 sm:max-w-sm'
                                    : 'flex max-w-xs items-center gap-3 p-3 sm:max-w-sm'
                            }`}
                        >
                            {item.kind === 'audio' ? (
                                <>
                                    <p className="block w-full truncate pr-6 text-xs font-medium text-slate-600 dark:text-slate-300">
                                        {item.name}
                                    </p>
                                    <audio
                                        src={item.url}
                                        controls
                                        className="h-10 w-full min-w-[200px] [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                        <DocumentIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1 pr-6">
                                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {item.name}
                                        </p>
                                        {item.size != null && (
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                {formatFileSize(item.size)}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <RemoveButton
                                onClick={() => onRemove(idx)}
                                variant="light"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(AttachedItemList);
