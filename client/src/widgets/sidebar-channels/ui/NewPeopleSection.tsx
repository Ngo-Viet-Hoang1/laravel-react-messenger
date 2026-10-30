import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, ChevronDown } from 'lucide-react';
import { UserListItem, useUserSearch } from '@/entities/user';
import { useStartDirectChatMutation } from '@/entities/channel';

export interface NewPeopleSectionProps {
  query: string;
  onChatStarted?: () => void;
}

export const NewPeopleSection: React.FC<NewPeopleSectionProps> = ({
  query,
  onChatStarted,
}) => {
  const navigate = useNavigate();

  const {
    users,
    isLoading,
    isFetching,
    hasMore,
    totalCount,
    loadMore,
    debouncedQuery,
  } = useUserSearch({
    query,
    pageSize: 4,
    enabled: query.trim().length >= 1,
  });

  const startChatMutation = useStartDirectChatMutation({
    onSuccess: (channel) => {
      onChatStarted?.();
      navigate(`/chat/${channel.id}`);
    },
  });

  return (
    <div className="pt-1 border-t border-sidebar-border/40">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 select-none">
        <span className="flex items-center gap-1.5">
          <UserPlus className="h-3 w-3 opacity-70" />
          New People
        </span>
        {isFetching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </div>

      {/* Section Body */}
      <div className="mt-0.5 space-y-0.5">
        {isLoading ? (
          <div className="px-2.5 py-1 text-xs text-sidebar-foreground/50">Searching...</div>
        ) : users.length === 0 ? (
          <div className="px-2.5 py-1 text-xs italic text-sidebar-foreground/50">
            No colleagues match &ldquo;{debouncedQuery || query}&rdquo;
          </div>
        ) : (
          <>
            {users.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                onSelect={(u) => startChatMutation.mutate(u.id)}
                disabled={startChatMutation.isPending}
                size="sm"
              />
            ))}

            {/* 'See more' Load More button */}
            {hasMore && (
              <div className="pt-1 px-1">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isFetching}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded py-1 text-[11px] font-medium text-sidebar-foreground/70 transition-colors select-none hover:bg-sidebar-accent/50 hover:text-sidebar-foreground disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 opacity-70" />
                      <span>
                        See more ({users.length} of {totalCount})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
