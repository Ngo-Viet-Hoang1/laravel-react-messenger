import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { UserAvatar } from './UserAvatar';
import type { UserDto } from '../model/types';

export interface UserListItemProps {
  user: UserDto;
  onSelect: (user: UserDto) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  actionText?: string;
  className?: string;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  user,
  onSelect,
  disabled = false,
  size = 'md',
  actionText = 'Chat →',
  className,
}) => {
  const isCompact = size === 'sm';

  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      disabled={disabled}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-2.5 rounded-md text-left transition-colors select-none disabled:opacity-50',
        isCompact
          ? 'px-2 py-1.5 hover:bg-sidebar-accent'
          : 'px-2.5 py-2 hover:bg-accent/60',
        className
      )}
    >
      <UserAvatar
        user={{ username: user.username, avatarUrl: user.avatarUrl }}
        size="sm"
        className={cn(
          'shrink-0',
          isCompact ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'
        )}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate font-semibold transition-colors group-hover:text-primary',
            isCompact ? 'text-xs text-sidebar-foreground' : 'text-xs text-foreground'
          )}
        >
          {user.username}
        </div>
        <div
          className={cn(
            'truncate',
            isCompact
              ? 'text-[10px] text-sidebar-foreground/60'
              : 'text-[11px] text-muted-foreground'
          )}
        >
          {user.email}
        </div>
      </div>
      {actionText && (
        <span
          className={cn(
            'shrink-0 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100',
            isCompact ? 'text-[10px]' : 'text-[11px]'
          )}
        >
          {actionText}
        </span>
      )}
    </button>
  );
};
