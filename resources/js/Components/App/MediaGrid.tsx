import type { MessageAttachment } from '@/types';
import { isVideo } from '@/utils';
import { PlayIcon } from '@heroicons/react/24/solid';
import React from 'react';

type Props = {
    mediaItems: MessageAttachment[];
    onAttachmentClick?: (
        attachments: MessageAttachment[],
        index: number,
    ) => void;
};

const MediaGrid = ({ mediaItems, onAttachmentClick }: Props) => {
    if (mediaItems.length === 0) {
        return (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No shared photos & videos
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            {mediaItems.map((item, index) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => onAttachmentClick?.(mediaItems, index)}
                    className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all duration-300 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-900"
                >
                    {isVideo(item) ? (
                        <div className="relative h-full w-full">
                            <video
                                src={item.url}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                            />
                            {/* Centered play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-xs transition-transform duration-200 group-hover:scale-110 dark:bg-slate-800/90 dark:text-slate-100">
                                    <PlayIcon className="ml-0.5 h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={item.url}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    )}
                </button>
            ))}
        </div>
    );
};

export default React.memo(MediaGrid);
