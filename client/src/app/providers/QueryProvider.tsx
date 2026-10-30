import * as React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  type DefaultOptions,
} from '@tanstack/react-query';
import { ApiError, getErrorMessage } from '@/shared/api';
import { toast } from 'sonner';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      suppressToast?: boolean;
      errorMessage?: string;
    };
  }
}

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
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressToast) return;
      const customMessage = mutation.meta?.errorMessage;
      toast.error(customMessage || getErrorMessage(error));
    },
  }),
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
