import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage, isAbortError } from '@/shared/api';

interface HealthStatus {
  status: string;
  version: string;
  service: string;
  timestamp: string;
}

export const HealthPage = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await api.get<HealthStatus>('/health', { signal });
      setHealth(data);
      setError(null);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStatus(controller.signal);
    return () => controller.abort();
  }, [loadStatus]);

  const handleRefresh = () => {
    loadStatus();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <div className="mb-6 flex items-center space-x-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            MessengerApp System Status
          </h1>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
            <div className="mb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Frontend Client
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">React 19 + Vite (FSD Architecture)</span>
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Active
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
            <div className="mb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Backend Service
            </div>
            {loading ? (
              <div className="animate-pulse text-sm text-slate-400">Checking /api/health...</div>
            ) : error ? (
              <div className="text-sm font-medium text-rose-400">Offline ({error})</div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{health?.service}</span>
                  <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    {health?.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Version: {health?.version} · Checked at:{' '}
                  {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-4 text-xs text-slate-400">
          <span>Target: .NET 10 & React 19</span>
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-indigo-600 px-3 py-1 font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
