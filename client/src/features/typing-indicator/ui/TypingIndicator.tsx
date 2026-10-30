import * as React from 'react';
import { useTypingUsers } from '../model/useTypingUsers';
import { cn } from '@/shared/lib/utils';

export interface TypingIndicatorProps {
  channelId?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  channelId,
  className,
}) => {
  const { typingText } = useTypingUsers(channelId);

  if (!typingText) {
    return <div className="h-5 select-none" aria-hidden="true" />;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex h-5 items-center gap-2 px-4 text-[11px] text-muted-foreground select-none animate-in fade-in duration-150',
        className
      )}
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" />
      </span>
      <span className="truncate font-normal italic">{typingText}</span>
    </div>
  );
};
