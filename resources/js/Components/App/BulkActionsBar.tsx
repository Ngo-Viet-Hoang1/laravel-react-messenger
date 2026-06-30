import { useConfirm } from '@/Contexts/ConfirmContext';
import {
    LockClosedIcon,
    LockOpenIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

type Props = {
    selectedCount: number;
    onClear: () => void;
    onBlock: () => Promise<void>;
    onUnblock: () => Promise<void>;
    onDelete: () => Promise<void>;
};

export default function BulkActionsBar({
    selectedCount,
    onClear,
    onBlock,
    onUnblock,
    onDelete,
}: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const confirmDialog = useConfirm();

    const handleAction = async (actionFn: () => Promise<void>) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await actionFn();
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        const isConfirmed = await confirmDialog({
            title: 'Delete Selected Users',
            message: `Permanently delete ${selectedCount} selected user accounts? This cannot be undone.`,
            isDanger: true,
            confirmText: 'Yes',
        });

        if (!isConfirmed) return;
        void handleAction(onDelete);
    };

    const handleBulkBlock = async () => {
        const isConfirmed = await confirmDialog({
            title: 'Block Selected Users',
            message: `Block ${selectedCount} selected user accounts?`,
            isDanger: true,
            confirmText: 'Yes',
        });

        if (!isConfirmed) return;
        void handleAction(onBlock);
    };

    return (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 transform px-4 transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-6 items-center justify-center rounded-full bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        {selectedCount} selected
                    </span>
                    <button
                        onClick={onClear}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Cancel
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleAction(onUnblock)}
                        disabled={isLoading}
                        className="btn h-9 gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 btn-outline btn-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <LockOpenIcon className="h-3.5 w-3.5" />
                        Unblock
                    </button>

                    <button
                        onClick={handleBulkBlock}
                        disabled={isLoading}
                        className="btn h-9 gap-1.5 rounded-lg border-none bg-gray-800 px-3 text-xs font-semibold text-white btn-sm hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-white"
                    >
                        <LockClosedIcon className="h-3.5 w-3.5" />
                        Block
                    </button>

                    <button
                        onClick={handleBulkDelete}
                        disabled={isLoading}
                        className="btn h-9 gap-1.5 rounded-lg border-none bg-red-600 px-3 text-xs font-semibold text-white btn-sm btn-error hover:bg-red-500 disabled:opacity-50"
                    >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
