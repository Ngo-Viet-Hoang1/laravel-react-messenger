import * as React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/app/store';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { initAuthInterceptors } from '@/app/providers/initAuthInterceptors';
import { ThemeProvider } from '@/shared/theme';
import { router } from '@/app/routes/router';
import { useAuthBootstrap } from '@/features/auth';
import { Toaster } from '@/shared/ui/sonner';

// Initialize HTTP interceptors with Redux store callbacks
initAuthInterceptors();

const AppContent: React.FC = () => {
  useAuthBootstrap();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="messenger-theme">
      <Provider store={store}>
        <QueryProvider>
          <AppContent />
        </QueryProvider>
      </Provider>
    </ThemeProvider>
  );
};
