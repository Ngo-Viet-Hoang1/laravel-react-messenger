import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import * as React from 'react';
import type { User } from '../model/types';

export interface UserAvatarProps {
  user?: Partial<Pick<User, 'username' | 'avatarUrl' | 'isOnline'>> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showPresence?: boolean;
  isOnline?: boolean;
  className?: string;
}

const SIZES = {
  xs: 'h-5 w-5 text-[10px] rounded-md',
  sm: 'h-8 w-8 text-xs rounded-lg',
  md: 'h-9 w-9 text-xs rounded-lg',
  lg: 'h-11 w-11 text-sm rounded-lg',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showPresence = false,
  isOnline = false,
  className,
}) => {
  const username = user?.username || 'User';
  const initials = username.slice(0, 2).toUpperCase();
  const online = isOnline || Boolean(user?.isOnline);

  return (
    <div className={cn('relative inline-flex aspect-square shrink-0', SIZES[size], className)}>
      <Avatar className="rounded-inherit aspect-square h-full w-full">
        {user?.avatarUrl ? (
          <AvatarImage
            src={user.avatarUrl}
            alt={username}
            className="rounded-inherit aspect-square h-full w-full object-cover"
          />
        ) : null}
        <AvatarFallback className="rounded-inherit flex aspect-square h-full w-full items-center justify-center bg-primary/10 font-semibold text-primary select-none">
          {initials}
        </AvatarFallback>
      </Avatar>

      {showPresence && (
        <span
          title={online ? 'Online' : 'Offline'}
          className={cn(
            'absolute -right-0.5 -bottom-0.5 shrink-0 rounded-full ring-2 ring-background',
            size === 'xs' ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5',
            online ? 'bg-emerald-500' : 'bg-muted-foreground/40'
          )}
        />
      )}
    </div>
  );
};
