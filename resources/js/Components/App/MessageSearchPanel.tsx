import useMessageSearch from '@/hooks/useMessageSearch';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useRef } from 'react';
import SearchResultItem from './SearchResultItem';

type Props = {
    channelId: number;
    onClose: () => void;
    onResultClick: (messageId: number) => void;
};

const MessageSearchPanel = ({ channelId, onClose, onResultClick }: Props) => {
    const {
        query,
        setQuery,
        results,
        isLoading,
        hasMore,
        totalResults,
        loadMore,
        reset,
    } = useMessageSearch(channelId);

    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback((): void => {
        reset();
        onClose();
    }, [reset, onClose]);

    const handleClear = useCallback((): void => {
        setQuery('');
        inputRef.current?.focus();
    }, [setQuery]);

    const handleScroll = useCallback((): void => {
        const el = scrollRef.current;
        if (!el) return;

        const nearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        if (nearBottom && hasMore && !isLoading) {
            loadMore();
        }
    }, [hasMore, isLoading, loadMore]);

    const showEmptyState =
        !isLoading && query.trim().length > 0 && results.length === 0;
    const showResults = results.length > 0;

    return (
        <div className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    Search Messages
                </h3>
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    onClick={handleClose}
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-700">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search in this channel…"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-8 pl-9 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700 dark:focus:ring-blue-500"
                        autoFocus
                    />
                    {query.length > 0 && (
                        <button
                            type="button"
                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                            onClick={handleClear}
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {totalResults > 0 && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {totalResults}{' '}
                        {totalResults === 1 ? 'result' : 'results'} found
                    </p>
                )}
            </div>

            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto"
                onScroll={handleScroll}
            >
                {showResults && (
                    <div className="py-1">
                        {results.map((message) => (
                            <SearchResultItem
                                key={message.id}
                                message={message}
                                searchQuery={query}
                                onClick={onResultClick}
                            />
                        ))}

                        {isLoading && (
                            <div className="flex justify-center p-3">
                                <span className="loading loading-sm loading-spinner text-primary" />
                            </div>
                        )}
                    </div>
                )}

                {showEmptyState && (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <MagnifyingGlassIcon className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            No messages found
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            Try a different keyword
                        </p>
                    </div>
                )}

                {!showResults && !showEmptyState && !isLoading && (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <MagnifyingGlassIcon className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            Type to search messages in this channel
                        </p>
                    </div>
                )}

                {isLoading && !showResults && (
                    <div className="flex justify-center p-6">
                        <span className="loading loading-spinner text-primary" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageSearchPanel;
