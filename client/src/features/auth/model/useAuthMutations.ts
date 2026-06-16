import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginDto, type RegisterDto } from '../api/authApi';
import { authKeys, currentUserQueryOptions } from '../api/authQueries';
import { useAppDispatch } from '@/app/store';
import { setAuth, clearAuth } from '@/entities/user';
import { sessionHint } from '@/shared/lib/sessionHint';
import { toast } from 'sonner';

export const useCurrentUserQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...currentUserQueryOptions(),
    enabled: options?.enabled,
  });
};

export const useLoginMutation = (options?: {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    meta: {
      errorMessage: 'Invalid email/username or password.',
    },
    onSuccess: (data) => {
      sessionHint.setSession();
      dispatch(setAuth({ user: data.user, accessToken: data.accessToken }));
      queryClient.setQueryData(authKeys.currentUser(), data.user);
      toast.success(`Welcome back, ${data.user.username}!`);
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
};

export const useGoogleLoginMutation = (options?: {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => authApi.googleLogin(token),
    meta: {
      errorMessage: 'Google authentication failed. Please try again.',
    },
    onSuccess: (data) => {
      sessionHint.setSession();
      dispatch(setAuth({ user: data.user, accessToken: data.accessToken }));
      queryClient.setQueryData(authKeys.currentUser(), data.user);
      toast.success(`Welcome, ${data.user.username}!`);
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
};

export const useRegisterMutation = (options?: {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    meta: {
      errorMessage: 'Registration failed. Please check your data.',
    },
    onSuccess: (data) => {
      sessionHint.setSession();
      dispatch(setAuth({ user: data.user, accessToken: data.accessToken }));
      queryClient.setQueryData(authKeys.currentUser(), data.user);
      toast.success(`Account created successfully! Welcome, ${data.user.username}!`);
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
};

export const useLogoutMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    meta: {
      suppressToast: true,
    },
    onSuccess: () => {
      sessionHint.clearSession();
      dispatch(clearAuth());
      queryClient.clear();
      toast.info('You have been logged out.');
    },
    onError: () => {
      sessionHint.clearSession();
      dispatch(clearAuth());
      queryClient.clear();
    },
  });
};
