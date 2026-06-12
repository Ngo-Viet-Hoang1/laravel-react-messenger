import TextInput from '@/Components/Breeze/TextInput';
import FilterSelect, { FilterSelectOption } from './FilterSelect';
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    onSearchClick: () => void;
    roleValue: string;
    onRoleChange: (value: string) => void;
    statusValue: string;
    onStatusChange: (value: string) => void;
    onNewUser: () => void;
};

const ROLE_OPTIONS: FilterSelectOption[] = [
    { value: '', label: 'All roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
];

const STATUS_OPTIONS: FilterSelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'blocked', label: 'Blocked' },
];

const UserFiltersBar = ({
    search,
    onSearchChange,
    onSearchClick,
    roleValue,
    onRoleChange,
    statusValue,
    onStatusChange,
    onNewUser,
}: Props) => {
    return (
        <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-200/10">
                        <UserGroupIcon className="h-5 w-5 text-gray-800 dark:text-gray-200" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            User Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            View, search and manage all user accounts
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onNewUser}
                    className="btn btn-sm h-10 border-none bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-white text-sm font-semibold rounded-lg px-4 gap-2"
                >
                    <UserPlusIcon className="h-4 w-4" />
                    New User
                </button>
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:max-w-xs">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <TextInput
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full !pl-9 h-10"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSearchClick();
                            }
                        }}
                    />
                </div>

                <FilterSelect
                    value={roleValue}
                    onChange={onRoleChange}
                    options={ROLE_OPTIONS}
                />

                <FilterSelect
                    value={statusValue}
                    onChange={onStatusChange}
                    options={STATUS_OPTIONS}
                />
            </div>
        </div>
    );
};

export default UserFiltersBar;
