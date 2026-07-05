import * as React from 'react';
import { UserAvatar } from '@/entities/user';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatMessageTime } from '@/shared/lib/formatters';
import { MESSAGE_STATUS, type ChatMessage } from '../model/types';

export interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  className?: string;
  actions?: React.ReactNode;
  reactions?: React.ReactNode;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  className,
  actions,
  reactions,
}) => {
  const isOptimistic = message.status === MESSAGE_STATUS.SENDING;
  const isFailed = message.status === MESSAGE_STATUS.FAILED;
  const timeFormatted = React.useMemo(
    () => formatMessageTime(message.createdAt),
    [message.createdAt]
  );

  return (
    <div
      className={cn(
        'group relative flex w-full gap-3 px-4 py-2 transition-colors duration-100 hover:bg-muted/40',
        isOptimistic && 'opacity-65',
        isFailed && 'bg-destructive/5 hover:bg-destructive/10',
        className
      )}
    >
      <div className="shrink-0 pt-0.5">
        <UserAvatar
          user={{
            username: message.senderUsername,
            avatarUrl: message.senderAvatarUrl,
          }}
          size="md"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-2">
          <span className="cursor-pointer truncate text-sm font-bold text-foreground hover:underline">
            {message.senderUsername}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground/80 select-none">
            {timeFormatted}
          </span>

          {isCurrentUser && (
            <span className="shrink-0 select-none">
              {isOptimistic && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                  <Clock className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span>sending...</span>
                </span>
              )}
              {isFailed && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>failed</span>
                </span>
              )}
            </span>
          )}
        </div>

        <div className="mt-0.5 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/90 select-text">
          {message.content}
        </div>

        {reactions}
      </div>

      {actions && (
        <div className="absolute -top-3 right-4 flex items-center rounded-lg border border-border/60 bg-background/95 px-1 py-0.5 shadow-xs backdrop-blur-md transition-opacity duration-150 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto has-[[data-state=open]]:opacity-100 has-[[data-state=open]]:pointer-events-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
