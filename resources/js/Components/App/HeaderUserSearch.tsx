import useUserSearch from '@/hooks/useUserSearch';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from './UserAvatar';

const EMPTY_CHANNELS: [] = [];

const HeaderUserSearch = () => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { results, isLoading } = useUserSearch(query, EMPTY_CHANNELS);

    // Toggle dropdown open/close based on query
    useEffect(() => {
        if (query.trim()) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [query]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent): void => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback((userId: number): void => {
        setQuery('');
        setIsOpen(false);
        router.post(route('channels.direct', userId));
    }, []);

    const handleClear = (): void => {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative hidden sm:block sm:w-64">
            {/* Search input */}
            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim()) setIsOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') handleClear();
                    }}
                    placeholder="Search users…"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pr-8 pl-8 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-300 focus:outline-none dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:bg-gray-700 dark:focus:ring-indigo-500/30"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown results */}
            {isOpen && (
                <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                    {isLoading && results.length === 0 && (
                        <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm text-gray-400">
                            <LoadingSpinner size="sm" />
                            Searching…
                        </div>
                    )}

                    {!isLoading && results.length === 0 && query.trim() && (
                        <div className="px-4 py-5 text-center text-sm text-gray-400">
                            No users found
                        </div>
                    )}

                    {results.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelect(user.id)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-indigo-50 dark:hover:bg-gray-700/60"
                        >
                            <UserAvatar user={user} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {user.name}
                                </p>
                                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                                    {user.email}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HeaderUserSearch;
