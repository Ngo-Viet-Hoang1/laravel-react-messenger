import { ThemeToggle } from '@/shared/theme';
import * as React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Outlet />

      <footer className="mt-8 text-center text-xs text-muted-foreground select-none">
        <span>Acme Inc.</span>
      </footer>
    </div>
  );
};
