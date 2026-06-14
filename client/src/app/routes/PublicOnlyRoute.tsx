import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/store';
import { selectIsAuthenticated, selectIsInitialLoading } from '@/entities/user';
import { Loader2 } from 'lucide-react';

export const PublicOnlyRoute: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialLoading = useAppSelector(selectIsInitialLoading);

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading application...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
};
