import useUserSearch from '@/hooks/useUserSearch';
import { ChatItem, ChatMember, User } from '@/types';
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useMemo, useState } from 'react';
import Modal from '../Breeze/Modal';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from './UserAvatar';

type Props = {
    isOpen: boolean;
    channel: ChatItem;
    onClose: () => void;
    onMemberAdded: (newMember: ChatMember) => void;
};

const AddMemberModal = ({ isOpen, channel, onClose, onMemberAdded }: Props) => {
    const [query, setQuery] = useState('');
    const [adding, setAdding] = useState<number | null>(null);

    const { results, isLoading } = useUserSearch(query, []);

    const existingMemberIds = useMemo(
        () => new Set((channel.users ?? []).map((u) => u.id)),
        [channel.users],
    );

    const filteredResults = useMemo(
        () => results.filter((u) => !existingMemberIds.has(u.id)),
        [results, existingMemberIds],
    );

    const handleAdd = async (user: User): Promise<void> => {
        setAdding(user.id);
        try {
            await axios.post(
                route('channels.members.add', [channel.id, user.id]),
            );
            onMemberAdded({
                id: user.id,
                name: user.name,
                avatar_url: user.avatar_url,
                is_admin: user.is_admin,
                blocked_at: user.blocked_at,
            });
            setQuery('');
        } catch {
            // silently ignore — parent can handle toast if needed
        } finally {
            setAdding(null);
        }
    };

    const handleClose = (): void => {
        setQuery('');
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="sm">
            <div className="p-5">
                <div className="mb-4 flex items-center gap-2">
                    <UserPlusIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        Add Member
                    </h2>
                </div>

                {/* Search input */}
                <div className="relative mb-3">
                    <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search users…"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:bg-slate-700"
                    />
                </div>

                {/* Results */}
                <div className="max-h-64 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                            <LoadingSpinner size="sm" />
                            Searching…
                        </div>
                    )}

                    {!isLoading &&
                        query.trim() &&
                        filteredResults.length === 0 && (
                            <p className="py-6 text-center text-sm text-slate-400">
                                No users found
                            </p>
                        )}

                    {!isLoading && !query.trim() && (
                        <p className="py-6 text-center text-sm text-slate-400">
                            Type a name to search
                        </p>
                    )}

                    {filteredResults.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                        >
                            <div className="flex items-center gap-2">
                                <UserAvatar user={user} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                        {user.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleAdd(user)}
                                disabled={adding === user.id}
                                className="ml-3 flex shrink-0 items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-300 transition-colors hover:bg-slate-800 hover:text-white hover:ring-slate-800 disabled:opacity-50 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-200 dark:hover:text-slate-900 dark:hover:ring-slate-200"
                            >
                                {adding === user.id ? (
                                    <LoadingSpinner size="xs" />
                                ) : (
                                    'Add'
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default AddMemberModal;
