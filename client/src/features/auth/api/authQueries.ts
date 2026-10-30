import { queryOptions, useQuery } from '@tanstack/react-query';
import { authApi } from './authApi';

export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.currentUser(),
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });

export const useCurrentUserQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...currentUserQueryOptions(),
    enabled: options?.enabled,
  });
};
