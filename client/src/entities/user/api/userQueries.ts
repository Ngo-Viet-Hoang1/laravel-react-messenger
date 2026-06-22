import { useQuery } from '@tanstack/react-query';
import { userApi } from './userApi';
import type { SearchUsersParams } from '../model/types';

export const userKeys = {
  all: ['users'] as const,
  search: (params?: SearchUsersParams) => [...userKeys.all, 'search', params] as const,
};

export const useSearchUsersQuery = (
  params?: SearchUsersParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: userKeys.search(params),
    queryFn: () => userApi.searchUsers(params),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  });
};
