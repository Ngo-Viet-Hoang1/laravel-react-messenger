import React from 'react';
import { LoginForm } from '@/features/auth';
import { AuthHeader } from './AuthHeader';

export const LoginPage: React.FC = () => (
  <>
    <AuthHeader
      title="Sign in to MessengerApp"
      description="Enter your credentials to access your workspace"
    />
    <LoginForm />
  </>
);
