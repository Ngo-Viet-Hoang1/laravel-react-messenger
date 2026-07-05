import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { useToggleReactionMutation, type ReactionGroupDto } from '@/entities/message';

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥'] as const;

export interface MessageActionsBarProps {
  messageId: string;
  channelId: string;
  reactions?: ReactionGroupDto[] | null;
  className?: string;
}

/**
 * Lightweight Slack-style action bar displayed on message hover.
 * Allows 1-click toggling for common reaction emojis.
 */
export const MessageActionsBar: React.FC<MessageActionsBarProps> = ({
  messageId,
  channelId,
  reactions,
  className,
}) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { mutate: toggleReaction } = useToggleReactionMutation(channelId);

  const isEmojiActive = (emoji: string): boolean => {
    if (!currentUser?.id || !reactions) return false;
    const group = reactions.find((g) => g.emoji === emoji);
    return Boolean(group && group.userIds.includes(currentUser.id));
  };

  const handleToggle = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    toggleReaction({ messageId, emoji });
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {QUICK_REACTION_EMOJIS.map((emoji) => {
        const active = isEmojiActive(emoji);

        return (
          <button
            key={emoji}
            type="button"
            onClick={(e) => handleToggle(e, emoji)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md text-sm transition-all duration-150 select-none cursor-pointer',
              active
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30 font-medium'
                : 'text-muted-foreground/80 hover:bg-muted hover:text-foreground hover:scale-115 active:scale-95'
            )}
            title={active ? `Remove ${emoji}` : `React with ${emoji}`}
            aria-label={active ? `Remove ${emoji}` : `React with ${emoji}`}
          >
            <span className="leading-none">{emoji}</span>
          </button>
        );
      })}
    </div>
  );
};
