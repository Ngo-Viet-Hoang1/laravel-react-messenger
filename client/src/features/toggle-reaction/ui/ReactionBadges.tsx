import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { useToggleReactionMutation, type ReactionGroupDto } from '@/entities/message';

export interface ReactionBadgesProps {
  messageId: string;
  channelId: string;
  reactions?: ReactionGroupDto[] | null;
  className?: string;
}

export const ReactionBadges: React.FC<ReactionBadgesProps> = ({
  messageId,
  channelId,
  reactions,
  className,
}) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { mutate: toggleReaction } = useToggleReactionMutation(channelId);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-1.5 flex flex-wrap items-center gap-1', className)}>
      {reactions.map((group) => {
        const hasReacted = Boolean(
          currentUser?.id && group.userIds.includes(currentUser.id)
        );

        return (
          <button
            key={group.emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleReaction({ messageId, emoji: group.emoji });
            }}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all duration-150 border select-none active:scale-95 cursor-pointer',
              hasReacted
                ? 'border-primary/40 bg-primary/15 text-primary font-medium hover:bg-primary/25'
                : 'border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted/90 hover:text-foreground'
            )}
            title={hasReacted ? `Remove ${group.emoji} reaction` : `React with ${group.emoji}`}
          >
            <span className="text-xs leading-none">{group.emoji}</span>
            <span className="text-[11px] font-semibold leading-none">{group.count}</span>
          </button>
        );
      })}
    </div>
  );
};
