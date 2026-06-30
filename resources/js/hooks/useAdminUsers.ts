import { LengthAwarePaginatedResponse, User } from '@/types';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AdminUserFilters = {
    q: string;
    role: '' | 'admin' | 'user';
    status: '' | 'active' | 'blocked';
};

type AdminUsersResponse = {
    users: LengthAwarePaginatedResponse<User>;
    filters: AdminUserFilters;
};

type UseAdminUsersReturn = {
    users: LengthAwarePaginatedResponse<User>;
    filters: AdminUserFilters;
    search: string;
    isLoading: boolean;
    selectedIds: Set<number>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;
    setSearch: (value: string) => void;
    handleSearchClick: () => void;
    handleRoleChange: (role: string) => void;
    handleStatusChange: (status: string) => void;
    handlePageChange: (url: string) => void;
    handleBulkBlock: () => Promise<void>;
    handleBulkUnblock: () => Promise<void>;
    handleBulkDelete: () => Promise<void>;
};

const useAdminUsers = (
    initialUsers: LengthAwarePaginatedResponse<User>,
    initialFilters: AdminUserFilters,
): UseAdminUsersReturn => {
    const [users, setUsers] = useState(initialUsers);
    const [filters, setFilters] = useState(initialFilters);
    const [search, setSearchState] = useState(initialFilters.q);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUrlRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        setUsers(initialUsers);
        setSelectedIds(new Set());
    }, [initialUsers]);

    useEffect(() => {
        setFilters(initialFilters);
        setSearchState(initialFilters.q);
    }, [initialFilters]);

    const fetchUsers = useCallback(
        async (params: Record<string, string>, url?: string): Promise<void> => {
            currentUrlRef.current = url;
            setIsLoading(true);
            try {
                const targetUrl = url ?? route('admin.users.index');
                const { data } = await axios.get<AdminUsersResponse>(
                    targetUrl,
                    {
                        params: url ? undefined : params,
                        headers: { Accept: 'application/json' },
                    },
                );
                setUsers(data.users);
                setFilters(data.filters);
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    const applyFilters = useCallback(
        (overrides: Partial<AdminUserFilters> = {}): void => {
            const merged = { ...filters, ...overrides };
            void fetchUsers(merged as Record<string, string>);
        },
        [filters, fetchUsers],
    );

    const clearDebounce = (): void => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    };

    const setSearch = (value: string): void => {
        setSearchState(value);
        clearDebounce();

        debounceRef.current = setTimeout(() => {
            applyFilters({ q: value });
        }, 500);
    };

    const handleSearchClick = (): void => {
        clearDebounce();
        applyFilters({ q: search });
    };

    const handleRoleChange = (role: string): void => {
        applyFilters({ role: role as AdminUserFilters['role'] });
    };

    const handleStatusChange = (status: string): void => {
        applyFilters({ status: status as AdminUserFilters['status'] });
    };

    const handlePageChange = (url: string): void => {
        void fetchUsers({}, url);
    };

    const handleBulkBlock = useCallback(async (): Promise<void> => {
        if (selectedIds.size === 0) return;
        setIsLoading(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map((id) =>
                    axios.post(
                        route('users.block', id),
                        { _method: 'PATCH' },
                        {
                            headers: {
                                Accept: 'application/json',
                            },
                        },
                    ),
                ),
            );
            setSelectedIds(new Set());
            await fetchUsers(filters, currentUrlRef.current);
        } finally {
            setIsLoading(false);
        }
    }, [selectedIds, filters, fetchUsers]);

    const handleBulkUnblock = useCallback(async (): Promise<void> => {
        if (selectedIds.size === 0) return;
        setIsLoading(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map((id) =>
                    axios.post(
                        route('users.unblock', id),
                        { _method: 'PATCH' },
                        {
                            headers: {
                                Accept: 'application/json',
                            },
                        },
                    ),
                ),
            );
            setSelectedIds(new Set());
            await fetchUsers(filters, currentUrlRef.current);
        } finally {
            setIsLoading(false);
        }
    }, [selectedIds, filters, fetchUsers]);

    const handleBulkDelete = useCallback(async (): Promise<void> => {
        if (selectedIds.size === 0) return;
        setIsLoading(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map((id) =>
                    axios.post(
                        route('users.destroy', id),
                        { _method: 'DELETE' },
                        {
                            headers: {
                                Accept: 'application/json',
                            },
                        },
                    ),
                ),
            );
            setSelectedIds(new Set());
            await fetchUsers(filters, currentUrlRef.current);
        } finally {
            setIsLoading(false);
        }
    }, [selectedIds, filters, fetchUsers]);

    return {
        users,
        filters,
        search,
        isLoading,
        selectedIds,
        setSelectedIds,
        setSearch,
        handleSearchClick,
        handleRoleChange,
        handleStatusChange,
        handlePageChange,
        handleBulkBlock,
        handleBulkUnblock,
        handleBulkDelete,
    };
};

export default useAdminUsers;
