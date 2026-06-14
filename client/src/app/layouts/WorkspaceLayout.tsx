import { WorkspaceHeader } from '@/widgets/workspace-header';
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar';
import * as React from 'react';
import { Outlet } from 'react-router-dom';

export const WorkspaceLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background font-sans text-foreground antialiased">
      <WorkspaceHeader />
      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar />
        <Outlet />
      </div>
    </div>
  );
};
