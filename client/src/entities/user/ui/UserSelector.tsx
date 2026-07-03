import * as React from 'react';
import { Search, Users, Check } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { UserAvatar } from './UserAvatar';
import { useUserSearch } from '../model/useUserSearch';
import type { UserDto } from '../model/types';
import { cn } from '@/shared/lib/utils';

export interface UserSelectorProps {
  selectedUserIds?: Set<string>;
  disabledUserIds?: Set<string>;
  disabledBadgeText?: string;
  multiSelect?: boolean;
  onSelectUser?: (user: UserDto) => void;
  onToggleUser?: (user: UserDto) => void;
  placeholder?: string;
  maxHeight?: string;
  autoFocus?: boolean;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserIds = new Set(),
  disabledUserIds = new Set(),
  disabledBadgeText = 'In channel',
  multiSelect = false,
  onSelectUser,
  onToggleUser,
  placeholder = 'Search by name or email...',
  maxHeight = 'max-h-60',
  autoFocus = false,
  className,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const { users, isLoading, hasMore, loadMore } = useUserSearch({
    query: searchTerm,
    pageSize: 10,
    enabled: true,
  });

  const handleClickUser = (user: UserDto) => {
    if (disabledUserIds.has(user.id)) return;

    if (multiSelect) {
      onToggleUser?.(user);
    } else {
      onSelectUser?.(user);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-4 text-sm bg-background border-border"
          autoFocus={autoFocus}
        />
      </div>

      {/* Results List */}
      <div className={cn('flex flex-col gap-1 overflow-y-auto pr-1', maxHeight)}>
        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-4 w-4 rounded-xs shrink-0" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Users className="h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm font-medium text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Try searching with another name or email address.
            </p>
          </div>
        ) : (
          <>
            {users.map((user: UserDto) => {
              const isDisabled = disabledUserIds.has(user.id);
              const isSelected = selectedUserIds.has(user.id);

              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleClickUser(user)}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors select-none',
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-muted/20'
                      : isSelected
                      ? 'bg-primary/10 border border-primary/30 cursor-pointer'
                      : 'hover:bg-accent/60 cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      user={{ username: user.username, avatarUrl: user.avatarUrl }}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {user.username}
                        </span>
                        {isDisabled && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded-xs font-medium">
                            {disabledBadgeText}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground font-normal">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {multiSelect && !isDisabled && (
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border group-hover:border-primary/60'
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </div>
                  )}

                  {!multiSelect && !isDisabled && (
                    <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Chat →
                    </span>
                  )}
                </button>
              );
            })}

            {hasMore && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadMore}
                className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                Load more candidates...
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
