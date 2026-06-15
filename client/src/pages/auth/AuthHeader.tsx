import React from 'react';

interface AuthHeaderProps {
  title: string;
  description: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, description }) => (
  <div className="mb-8 flex flex-col items-center gap-2 text-center select-none">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-2xl shadow-md">
      #
    </div>
    <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
