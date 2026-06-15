import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginDto, type RegisterDto } from '../api/authApi';
import { authKeys, currentUserQueryOptions } from '../api/authQueries';
import { useAppDispatch } from '@/app/store';
import { setAuth, clearAuth, type User } from '@/entities/user';
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
      const user: User = {
        id: data.userId,
        email: data.email,
        username: data.username,
        avatarUrl: data.avatarUrl,
      };
      dispatch(setAuth({ user, accessToken: data.accessToken }));
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      toast.success(`Welcome back, ${data.username}!`);
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
      const user: User = {
        id: data.userId,
        email: data.email,
        username: data.username,
        avatarUrl: data.avatarUrl,
      };
      dispatch(setAuth({ user, accessToken: data.accessToken }));
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      toast.success(`Account created successfully! Welcome, ${data.username}!`);
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
