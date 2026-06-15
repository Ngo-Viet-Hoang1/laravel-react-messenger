import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import type { User } from '../model/types';

export interface UserAvatarProps {
  user?: Partial<Pick<User, 'username' | 'avatarUrl' | 'isOnline'>> | null;
  size?: 'sm' | 'md' | 'lg';
  showPresence?: boolean;
  isOnline?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
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
  const online = isOnline || !!user?.isOnline;

  return (
    <div className="relative inline-flex shrink-0">
      <Avatar className={cn(SIZES[size], className)}>
        {user?.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={username} className="object-cover" />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold select-none">
          {initials}
        </AvatarFallback>
      </Avatar>

      {showPresence && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background',
            online ? 'bg-emerald-500' : 'bg-muted-foreground/40'
          )}
        />
      )}
    </div>
  );
};
