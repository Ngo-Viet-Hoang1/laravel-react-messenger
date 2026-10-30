import * as React from 'react';
import { Loader2, Server } from 'lucide-react';

export const ServerWakingScreen: React.FC = () => {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center select-none">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
        <Server className="h-7 w-7 animate-pulse" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-foreground">
        Starting demo server...
      </h2>

      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        Render free tier spins down instances after inactivity. Please hold on
        for a moment while the backend wakes up (~30s).
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span>Connecting to backend... {seconds}s</span>
      </div>
    </div>
  );
};
