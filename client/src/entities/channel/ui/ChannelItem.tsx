import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import type { ChannelSummary } from '../model/types';
import { ChannelAvatar } from './ChannelAvatar';
import { Lock } from 'lucide-react';

export interface ChannelItemProps {
  channel: ChannelSummary;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isActive = false,
  onClick,
  className,
}) => {
  const unreadCount = Number(channel.unreadCount ?? 0);
  const isUnread = !isActive && (unreadCount > 0 || Boolean(channel.hasUnread));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors select-none',
        isActive
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-2xs'
          : isUnread
            ? 'font-bold text-foreground hover:bg-sidebar-accent/80'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
        className
      )}
    >
      <ChannelAvatar channel={channel} size="sm" isActive={isActive} />

      <span className="flex flex-1 items-center gap-1.5 truncate tracking-tight">
        {channel.isSecret && (
          <Lock
            className="h-3 w-3 shrink-0 text-muted-foreground"
            aria-label="End-to-End Encrypted"
          />
        )}
        <span className="truncate">{channel.name}</span>
      </span>

      {unreadCount > 0 && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
