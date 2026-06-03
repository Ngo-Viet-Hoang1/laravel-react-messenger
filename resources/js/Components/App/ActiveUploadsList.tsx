import { useUploads } from '@/Contexts/UploadContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

type Props = {
    channelId: number;
};

const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ActiveUploadsList = ({ channelId }: Props) => {
    const { uploads, cancelUpload, clearUpload } = useUploads();

    const channelUploads = uploads.filter((u) => u.channelId === channelId);

    if (channelUploads.length === 0) return null;

    return (
        <div className="mx-2 mb-2 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sending files ({channelUploads.length})
            </div>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {channelUploads.map((upload) => {
                    const isUploading = upload.status === 'uploading';
                    const isCompleted = upload.status === 'completed';
                    const isFailed = upload.status === 'failed';
                    const isCancelled = upload.status === 'cancelled';

                    return (
                        <div
                            key={upload.id}
                            className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2 text-xs transition-colors dark:bg-slate-800"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium text-slate-800 dark:text-slate-200">
                                        {upload.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {formatBytes(upload.size)}
                                        {isUploading && ` • ${upload.progress}%`}
                                        {isCompleted && ' • Complete'}
                                        {isFailed && ' • Failed'}
                                        {isCancelled && ' • Cancelled'}
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {isUploading ? (
                                        <button
                                            type="button"
                                            onClick={() => cancelUpload(upload.id)}
                                            className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                            title="Cancel upload"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => clearUpload(upload.id)}
                                            className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                            title="Clear"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isUploading && (
                                <progress
                                    value={upload.progress}
                                    max={100}
                                    className="progress progress-info h-1.5 w-full"
                                />
                            )}
                            {isCompleted && (
                                <progress
                                    value={100}
                                    max={100}
                                    className="progress progress-success h-1.5 w-full"
                                />
                            )}
                            {isFailed && (
                                <progress
                                    value={100}
                                    max={100}
                                    className="progress progress-error h-1.5 w-full opacity-50"
                                />
                            )}
                            {isCancelled && (
                                <progress
                                    value={100}
                                    max={100}
                                    className="progress progress-warning h-1.5 w-full opacity-50"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActiveUploadsList;
