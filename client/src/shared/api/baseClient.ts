import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, HttpStatus, getHttpStatusPhrase, type ProblemDetails } from './types';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
    silent?: boolean;
  }
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    silent?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DEFAULT_TIMEOUT_MS = 10_000;

export const baseClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;
type SessionExpiredHandler = () => void;

let onGetToken: TokenGetter | null = null;
let onTokenRefresh: RefreshHandler | null = null;
let onSessionExpired: SessionExpiredHandler | null = null;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

/**
 * Clean Architecture Callback Registration:
 * Decouples the shared API layer from upper layers (Redux store, entities, app).
 * Shared modules never import directly from `app/` or `entities/`.
 */
export const registerTokenGetter = (getter: TokenGetter) => {
  onGetToken = getter;
};

export const registerTokenRefreshHandler = (handler: RefreshHandler) => {
  onTokenRefresh = handler;
};

export const registerSessionExpiredHandler = (handler: SessionExpiredHandler) => {
  onSessionExpired = handler;
};

export const createSessionExpiredError = () =>
  new ApiError({
    status: HttpStatus.UNAUTHORIZED,
    title: 'Session Expired',
    detail: 'Your session has expired or is invalid. Please log in again.',
  });

baseClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = onGetToken ? onGetToken() : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.headers && !config.headers['X-Correlation-ID']) {
      const correlationId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      config.headers['X-Correlation-ID'] = correlationId;
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const notifySessionExpired = () => {
  try {
    onSessionExpired?.();
  } catch (err) {
    console.error('[baseClient] Error in onSessionExpired callback:', err);
  }
};

const isProblemDetailsPayload = (data: unknown): data is ProblemDetails => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const body = data as Record<string, unknown>;
  return typeof body.title === 'string' && typeof body.status === 'number';
};

const isHtmlPayload = (data: unknown): boolean =>
  typeof data === 'string' && /<\s*(!doctype|[a-z]+)(\s|>)/i.test(data.trim());

baseClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    const isAuthRequest =
      originalRequest?._skipAuthRefresh ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    // Handle 401 Unauthorized via Decoupled Refresh Handler
    if (
      error.response?.status === HttpStatus.UNAUTHORIZED &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest &&
      onTokenRefresh
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest._retry = true;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return baseClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await onTokenRefresh();
        if (!newToken) {
          throw createSessionExpiredError();
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        processQueue(null, newToken);
        return baseClient(originalRequest);
      } catch (refreshErr) {
        const sessionError = createSessionExpiredError();
        processQueue(sessionError, null);
        notifySessionExpired();
        return Promise.reject(sessionError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return Promise.reject(
        new ApiError({
          status: 408,
          title: 'Request Timeout',
          detail: 'The server took too long to respond. Please check your network and try again.',
        })
      );
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError({
          status: 0,
          title: 'Network Error',
          detail: error.message || 'Unable to connect to the backend server.',
        })
      );
    }

    const status = error.response.status;
    const rawData = error.response.data;
    const correlationId = (error.response.headers?.['x-correlation-id'] as string) || undefined;

    if (isProblemDetailsPayload(rawData)) {
      const problemDetails: ProblemDetails = {
        ...rawData,
        traceId: rawData.traceId ?? correlationId,
      };
      return Promise.reject(new ApiError(problemDetails));
    }

    const fallbackTitle = getHttpStatusPhrase(status);
    const fallbackDetail =
      !isHtmlPayload(rawData) && typeof rawData === 'string' && rawData.trim().length > 0
        ? rawData.slice(0, 300)
        : `Server returned HTTP status ${status}.`;

    return Promise.reject(
      new ApiError({
        status,
        title: fallbackTitle,
        detail: fallbackDetail,
        traceId: correlationId,
      })
    );
  }
);

export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await baseClient.get<T>(url, config);
    return res.data;
  },
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await baseClient.post<T>(url, data, config);
    return res.data;
  },
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await baseClient.put<T>(url, data, config);
    return res.data;
  },
  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await baseClient.patch<T>(url, data, config);
    return res.data;
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await baseClient.delete<T>(url, config);
    return res.data;
  },
};
