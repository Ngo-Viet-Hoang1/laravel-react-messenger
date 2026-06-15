import { useEffect } from 'react';
import { useAppDispatch } from '@/app/store';
import { setAuth, clearAuth } from '@/entities/user';
import { authApi } from '../api/authApi';
import { sessionHint } from '@/shared/lib/sessionHint';
import { ApiError, HttpStatus } from '@/shared/api';

export const useAuthBootstrap = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!sessionHint.hasSession()) {
      dispatch(clearAuth());
      return;
    }

    const restoreSession = async () => {
      try {
        const res = await authApi.refresh();
        sessionHint.setSession();
        dispatch(
          setAuth({
            user: {
              id: res.userId,
              email: res.email,
              username: res.username,
              avatarUrl: res.avatarUrl,
            },
            accessToken: res.accessToken,
          })
        );
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === HttpStatus.UNAUTHORIZED) {
          sessionHint.clearSession();
          dispatch(clearAuth());
        } else {
          console.warn(
            '[useAuthBootstrap] Transient network or server error during session restore:',
            err
          );
          dispatch(clearAuth());
        }
      }
    };

    restoreSession();
  }, [dispatch]);
};
