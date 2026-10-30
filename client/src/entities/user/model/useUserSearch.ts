import { useDebounce } from '@/shared/lib';
import * as React from 'react';
import { useSearchUsersQuery } from '../api/userQueries';
import type { UserDto } from './types';

export interface UseUserSearchOptions {
  query: string;
  pageSize?: number;
  enabled?: boolean;
  debounceMs?: number;
}

export function useUserSearch({
  query,
  pageSize = 8,
  enabled = true,
  debounceMs = 200,
}: UseUserSearchOptions) {
  const debouncedQuery = useDebounce(query.trim(), debounceMs);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [accumulatedUsers, setAccumulatedUsers] = React.useState<UserDto[]>([]);

  // Reset pagination state whenever the debounced query changes
  React.useEffect(() => {
    setPageNumber(1);
    setAccumulatedUsers([]);
  }, [debouncedQuery]);

  const { data, isLoading, isFetching } = useSearchUsersQuery(
    {
      search: debouncedQuery || undefined,
      pageNumber,
      pageSize,
    },
    { enabled: enabled && debouncedQuery.length >= 1 }
  );

  // Accumulate pages when user loads more results
  React.useEffect(() => {
    if (!data?.items) return;

    if (pageNumber === 1) {
      setAccumulatedUsers(data.items);
      return;
    }

    setAccumulatedUsers((prev) => {
      const existingIds = new Set(prev.map((u) => u.id));
      const newItems = data.items.filter((u) => !existingIds.has(u.id));
      return [...prev, ...newItems];
    });
  }, [data, pageNumber]);

  const loadMore = React.useCallback(() => {
    setPageNumber((p) => p + 1);
  }, []);

  const reset = React.useCallback(() => {
    setPageNumber(1);
    setAccumulatedUsers([]);
  }, []);

  return {
    users: accumulatedUsers,
    isLoading: isLoading && accumulatedUsers.length === 0,
    isFetching,
    hasMore: Boolean(data?.hasNextPage),
    totalCount: Number(data?.totalCount ?? 0),
    loadMore,
    reset,
    debouncedQuery,
  };
}
