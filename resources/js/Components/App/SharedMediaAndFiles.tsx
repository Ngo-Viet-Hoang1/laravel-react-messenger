import type { MessageAttachment } from '@/types';
import { isImage, isVideo } from '@/utils';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import FileList from './FileList';
import MediaGrid from './MediaGrid';

type Props = {
    channelId: number;
    onAttachmentClick?: (
        attachments: MessageAttachment[],
        index: number,
    ) => void;
};

const SharedMediaAndFiles = ({ channelId, onAttachmentClick }: Props) => {
    const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'media' | 'files'>('media');

    useEffect(() => {
        const controller = new AbortController();

        const fetchAttachments = async () => {
            setLoading(true);
            setError(false);

            try {
                const res = await axios.get<{ data: MessageAttachment[] }>(
                    `/channels/${channelId}/attachments`,
                    { signal: controller.signal },
                );
                setAttachments(res.data.data || []);
            } catch (err) {
                if (axios.isCancel(err)) {
                    return;
                }
                console.error('Error fetching channel attachments:', err);
                setError(true);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchAttachments();

        return () => {
            controller.abort();
        };
    }, [channelId]);

    if (loading) {
        return (
            <div className="flex h-24 items-center justify-center">
                <span className="loading loading-md loading-spinner text-slate-500 dark:text-slate-400"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-6 text-center text-xs text-red-500">
                Failed to load shared media.
            </div>
        );
    }

    const mediaItems = attachments.filter(
        (item) => isImage(item) || isVideo(item),
    );
    const fileItems = attachments.filter(
        (item) => !isImage(item) && !isVideo(item),
    );

    return (
        <div className="flex flex-col gap-3">
            {/* Simple tab bar */}
            <div className="flex border-b border-slate-100 pb-1 dark:border-slate-700/60">
                <button
                    type="button"
                    onClick={() => setActiveTab('media')}
                    className={`flex-1 pb-2 text-center text-xs font-semibold transition-all ${
                        activeTab === 'media'
                            ? 'border-b-2 border-slate-800 font-bold text-slate-800 dark:border-slate-200 dark:text-slate-200'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    Media ({mediaItems.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('files')}
                    className={`flex-1 pb-2 text-center text-xs font-semibold transition-all ${
                        activeTab === 'files'
                            ? 'border-b-2 border-slate-800 font-bold text-slate-800 dark:border-slate-200 dark:text-slate-200'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    Files ({fileItems.length})
                </button>
            </div>

            {/* Content panel with internal scrolling */}
            <div className="max-h-[280px] overflow-y-auto pr-1">
                {activeTab === 'media' ? (
                    <MediaGrid
                        mediaItems={mediaItems}
                        onAttachmentClick={onAttachmentClick}
                    />
                ) : (
                    <FileList fileItems={fileItems} />
                )}
            </div>
        </div>
    );
};

export default React.memo(SharedMediaAndFiles);
