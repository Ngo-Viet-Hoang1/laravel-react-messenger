import { useStartDirectChatMutation, type ChannelDetail } from '@/entities/channel';
import { UserListItem, useUserSearch, type UserDto } from '@/entities/user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { ChevronDown, Loader2, MessageSquarePlus, Search, UserX } from 'lucide-react';
import * as React from 'react';

export interface StartDirectChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatStarted?: (channel: ChannelDetail) => void;
}

export const StartDirectChatModal: React.FC<StartDirectChatModalProps> = ({
  open,
  onOpenChange,
  onChatStarted,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const { users, isLoading, isFetching, hasMore, totalCount, loadMore, reset, debouncedQuery } =
    useUserSearch({
      query: searchTerm,
      pageSize: 8,
      enabled: open,
    });

  const mutation = useStartDirectChatMutation({
    onSuccess: (channel) => {
      setSearchTerm('');
      reset();
      onOpenChange(false);
      onChatStarted?.(channel);
    },
  });

  const handleSelectUser = (user: UserDto) => {
    mutation.mutate(user.id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query || mutation.isPending) return;

    const matched =
      users.find((u) => u.email.toLowerCase() === query || u.username.toLowerCase() === query) ||
      (users.length === 1 ? users[0] : null);

    if (!matched) return;
    mutation.mutate(matched.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b bg-card p-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquarePlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                New Direct Message
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                Find colleagues by username or email to start a private conversation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Input Bar */}
        <form onSubmit={handleFormSubmit} className="border-b bg-background p-3">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 my-auto ml-3 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username or email..."
              className="h-9 pl-8 text-xs font-normal text-foreground placeholder:text-muted-foreground"
              autoFocus
              disabled={mutation.isPending}
            />
            {mutation.isPending && (
              <span className="absolute inset-y-0 right-0 my-auto mr-3 flex items-center">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              </span>
            )}
          </div>
        </form>

        {/* User Results List View */}
        <div className="max-h-72 divide-y divide-border/30 overflow-y-auto p-2">
          {/* Loading initial query */}
          {isLoading && <UserSearchSkeleton />}

          {/* Populated list */}
          {users.length > 0 && (
            <>
              {users.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onSelect={handleSelectUser}
                  disabled={mutation.isPending}
                  size="md"
                />
              ))}

              {hasMore && (
                <div className="px-1 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isFetching}
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-muted/30 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground disabled:opacity-50"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        See more colleagues ({users.length} of {totalCount})
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Search returned no results */}
          {!isLoading && users.length === 0 && debouncedQuery && (
            <div className="px-4 py-6 text-center">
              <UserX className="mx-auto mb-1.5 h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No users found matching &ldquo;
                <span className="font-semibold text-foreground">{debouncedQuery}</span>
                &rdquo;.
              </p>
            </div>
          )}

          {/* Default prompt */}
          {!isLoading && users.length === 0 && !debouncedQuery && (
            <div className="px-4 py-8 text-center select-none">
              <Search className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs font-semibold text-foreground">Find someone to message</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Type a name or email address above to search.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UserSearchSkeleton: React.FC = () => (
  <div className="space-y-2 p-2">
    <div className="flex items-center gap-2.5">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
    <div className="flex items-center gap-2.5">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  </div>
);
