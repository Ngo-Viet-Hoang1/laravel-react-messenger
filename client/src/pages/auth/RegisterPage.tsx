import React from 'react';
import { RegisterForm } from '@/features/auth';
import { AuthHeader } from './AuthHeader';

export const RegisterPage: React.FC = () => (
  <>
    <AuthHeader
      title="Create your account"
      description="Join your workspace with enterprise security"
    />
    <RegisterForm />
  </>
);
