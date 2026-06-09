import { User } from '@/types';
import UserAvatar from './UserAvatar';

type Props = {
    results: User[];
    isLoading: boolean;
    query: string;
    onSelect: (userId: number) => void;
};

const UserSearchResults = ({
    results,
    isLoading,
    query,
    onSelect,
}: Props) => {
    if (!query.trim()) return null;

    return (
        <div className="absolute inset-x-0 top-full z-20 max-h-[calc(100vh-200px)] overflow-y-auto border-t border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
            {isLoading && results.length === 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-400">
                    <span className="loading loading-spinner loading-sm" />
                    Searching…
                </div>
            )}

            {!isLoading && results.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No users found
                </div>
            )}

            {results.map((user) => (
                <button
                    key={user.id}
                    type="button"
                    onClick={() => onSelect(user.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-indigo-50 dark:hover:bg-slate-700/60"
                >
                    <UserAvatar user={user} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                            {user.email}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default UserSearchResults;
