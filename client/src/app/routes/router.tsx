import { AuthLayout } from '@/app/layouts/AuthLayout';
import { WorkspaceLayout } from '@/app/layouts/WorkspaceLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { HealthPage } from '@/pages/health/HealthPage';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <WorkspaceLayout />,
        children: [
          { path: '/chat', element: <ChatPage /> },
          { path: '/chat/:channelId', element: <ChatPage /> },
        ],
      },
    ],
  },
  {
    path: '/health',
    element: <HealthPage />,
  },
  {
    path: '*',
    element: <Navigate to="/chat" replace />,
  },
]);
