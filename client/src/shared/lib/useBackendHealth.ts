import * as React from 'react';

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const HEALTH_ENDPOINT = RAW_API_BASE_URL.endsWith('/api')
  ? `${RAW_API_BASE_URL}/health`
  : `${RAW_API_BASE_URL}/api/health`;

export const useBackendHealth = () => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const checkHealth = async () => {
      try {
        const res = await fetch(HEALTH_ENDPOINT, { method: 'GET' });
        if (res.ok && isMounted) {
          setIsReady(true);
          return;
        }
      } catch {
        console.error('Error checking backend health');
      }

      if (isMounted) {
        timer = setTimeout(checkHealth, 2500);
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return isReady;
};
