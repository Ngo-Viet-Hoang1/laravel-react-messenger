import * as React from 'react';
import { Hash } from 'lucide-react';
import { UserAvatar, usePresenceStore } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { CHANNEL_TYPE, type ChannelSummary, type ChannelDetail } from '../model/types';

export interface ChannelAvatarProps {
  channel?:
    | (Pick<ChannelSummary | ChannelDetail, 'name' | 'type' | 'avatarUrl'> & {
        otherUserId?: string | null;
      })
    | null;
  size?: 'sm' | 'md';
  className?: string;
  isActive?: boolean;
}

const CONTAINER_SIZES = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-lg',
};

const ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-4.5 w-4.5',
};

export const ChannelAvatar: React.FC<ChannelAvatarProps> = ({
  channel,
  size = 'sm',
  className,
  isActive = false,
}) => {
  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;
  const isOnline = usePresenceStore((state) =>
    isDirect && channel?.otherUserId ? state.isUserOnline(channel.otherUserId) : false
  );

  const displayName = channel?.name || 'Channel';

  if (isDirect) {
    return (
      <UserAvatar
        user={{ username: displayName, avatarUrl: channel?.avatarUrl }}
        size={size}
        showPresence
        isOnline={isOnline}
        className={className}
      />
    );
  }

  if (channel?.avatarUrl) {
    return (
      <div
        className={cn(
          'relative inline-flex aspect-square shrink-0 overflow-hidden rounded-lg',
          CONTAINER_SIZES[size],
          className
        )}
      >
        <img
          src={channel.avatarUrl}
          alt={displayName}
          referrerPolicy="no-referrer"
          className="h-full w-full rounded-lg object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex aspect-square shrink-0 items-center justify-center rounded-lg bg-sidebar-accent/60 text-sidebar-foreground/70',
        CONTAINER_SIZES[size],
        isActive && 'text-primary',
        className
      )}
    >
      <Hash className={ICON_SIZES[size]} />
    </div>
  );
};
