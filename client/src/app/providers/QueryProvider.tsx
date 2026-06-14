import * as React from 'react';
import { QueryClient, QueryClientProvider, type DefaultOptions } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import { toast } from 'sonner';

/**
 * Enterprise-Grade TanStack Query Configuration:
 * - Retry strategy: 4xx errors are client mistakes (never retry); retry 5xx/network errors at most once.
 * - Cache freshness: Data stays fresh for 5 mins, inactive cache collected after 10 mins.
 * - Mutation error handling: Emits global toast unless detailed inline field validation errors exist.
 */
const queryConfig: DefaultOptions = {
  queries: {
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status && error.status < 500) {
        return false;
      }
      return failureCount < 1;
    },
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: false,
    throwOnError: false,
    networkMode: 'online',
  },

  mutations: {
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isNetworkError) {
        return failureCount < 1;
      }
      return false;
    },
    throwOnError: false,
    networkMode: 'online',
    onError: (error) => {
      if (error instanceof ApiError) {
        // Intelligently suppress global toast if inline form validation errors are present
        const hasFieldErrors = !!error.errors && Object.keys(error.errors).length > 0;
        if (!hasFieldErrors) {
          toast.error(error.message);
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
