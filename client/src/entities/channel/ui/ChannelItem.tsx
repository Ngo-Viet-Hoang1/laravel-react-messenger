import { UserAvatar } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { Circle, Hash } from 'lucide-react';
import * as React from 'react';
import { CHANNEL_TYPE, type ChannelSummary } from '../model/types';

export interface ChannelItemProps {
  channel: ChannelSummary;
  isActive?: boolean;
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isActive = false,
  unreadCount = 0,
  onClick,
  className,
}) => {
  const isGroup = channel.type === CHANNEL_TYPE.GROUP;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors select-none',
        isActive
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-2xs'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
        className
      )}
    >
      {isGroup ? (
        <Hash
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            isActive
              ? 'text-primary'
              : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
          )}
        />
      ) : (
        <div className="relative shrink-0">
          <UserAvatar
            user={{ username: channel.name, avatarUrl: channel.avatarUrl }}
            size="sm"
            className="h-4 w-4 text-[9px]"
          />
          <Circle className="absolute -right-0.5 -bottom-0.5 h-1.5 w-1.5 fill-emerald-500 text-emerald-500" />
        </div>
      )}

      <span className="flex-1 truncate tracking-tight">{channel.name}</span>

      {unreadCount > 0 && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
