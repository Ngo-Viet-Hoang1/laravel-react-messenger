import { store } from '@/app/store';
import { clearAuth, setAccessToken } from '@/entities/user';
import { authApi } from '@/features/auth';
import {
  registerSessionExpiredHandler,
  registerTokenGetter,
  registerTokenRefreshHandler,
} from '@/shared/api';
import { registerSignalRTokenGetter } from '@/shared/lib/signalr';
import { sessionHint } from '@/shared/lib/sessionHint';

export const initAuthInterceptors = () => {
  registerTokenGetter(() => store.getState().auth.accessToken);
  registerSignalRTokenGetter(() => store.getState().auth.accessToken);

  registerTokenRefreshHandler(async () => {
    try {
      const res = await authApi.refresh();
      sessionHint.setSession();
      store.dispatch(setAccessToken(res.accessToken));
      return res.accessToken;
    } catch {
      sessionHint.clearSession();
      store.dispatch(clearAuth());
      return null;
    }
  });

  registerSessionExpiredHandler(() => {
    sessionHint.clearSession();
    store.dispatch(clearAuth());
  });
};
