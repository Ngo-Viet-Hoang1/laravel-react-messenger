const SESSION_HINT_KEY = 'messenger_has_session';

export const sessionHint = {
  hasSession: (): boolean => {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) === 'true';
    } catch {
      return false;
    }
  },
  setSession: (): void => {
    try {
      localStorage.setItem(SESSION_HINT_KEY, 'true');
    } catch {
      // Ignore storage errors in private browsing modes
    }
  },
  clearSession: (): void => {
    try {
      localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};
