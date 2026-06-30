import type { MessageAttachment } from '@/types';
import { formatFileSize } from '@/utils';
import { ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import React from 'react';

type Props = {
    fileItems: MessageAttachment[];
};

const FileList = ({ fileItems }: Props) => {
    if (fileItems.length === 0) {
        return (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No shared files
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {fileItems.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-all duration-200 hover:border-slate-200 dark:border-slate-700/40 dark:bg-slate-800/40 dark:hover:border-slate-700"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <DocumentIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {item.name}
                            </p>
                            <p className="text-[10px] font-normal text-slate-400">
                                {item.size
                                    ? formatFileSize(item.size)
                                    : 'Unknown size'}
                            </p>
                        </div>
                    </div>

                    <a
                        href={item.url}
                        download
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        title={`Download ${item.name}`}
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                    </a>
                </div>
            ))}
        </div>
    );
};

export default React.memo(FileList);
