import * as React from 'react';
import { SidebarChannels } from '@/widgets/sidebar-channels';
import { cn } from '@/shared/lib/utils';

export interface WorkspaceSidebarProps {
  className?: string;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ className }) => {
  return (
    <aside
      className={cn(
        'flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground select-none overflow-y-auto px-2 py-3',
        className
      )}
    >
      <SidebarChannels />
    </aside>
  );
};
