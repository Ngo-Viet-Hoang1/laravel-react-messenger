import * as React from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';
import { useInfiniteSearchChannelMessagesQuery, type MessageDto } from '@/entities/message';
import { useDebounce } from '@/shared/lib';
import { formatSearchDateTime } from '@/shared/lib/formatters';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

export interface ChannelSearchTabProps {
  channelId: string;
  onSelectMessage: (messageId: string) => void;
}

export const ChannelSearchTab: React.FC<ChannelSearchTabProps> = ({
  channelId,
  onSelectMessage,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedQuery = useDebounce(searchTerm.trim(), 250);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    setSearchTerm('');
  }, [channelId]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteSearchChannelMessagesQuery(
    channelId,
    debouncedQuery,
    20,
    Boolean(channelId && debouncedQuery)
  );

  const items: MessageDto[] = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items ?? []);
  }, [data]);

  const totalCount = Number(data?.pages[0]?.totalCount ?? 0);

  const renderHighlighted = (content: string, keyword: string) => {
    if (!keyword.trim()) return content;

    const parts = content.split(
      new RegExp(`(${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')
    );

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <mark key={i} className="rounded-2xs bg-primary/20 px-0.5 font-semibold text-primary">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search Input Box */}
      <div className="border-b border-border/30 p-3">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Find in this channel..."
            className="h-8.5 w-full rounded-md border border-border/70 bg-background pr-8 pl-8.5 text-xs text-foreground transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 flex h-4 w-4 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
              title="Clear text"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Results Feed */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {!debouncedQuery && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <Search className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Search this channel</p>
            <p className="mt-0.5 text-[11px]">Type keywords above to find matching messages.</p>
          </div>
        )}

        {debouncedQuery && (
          <div className="flex items-center justify-between px-1 pb-1 text-[11px] text-muted-foreground">
            {isLoading || (isFetching && !isFetchingNextPage) ? (
              <span className="flex items-center gap-1.5 text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching...
              </span>
            ) : (
              <span>
                Found <strong className="text-foreground">{totalCount}</strong> message
                {totalCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
            Failed to search messages.
          </div>
        )}

        {debouncedQuery && !isLoading && !isError && items.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <p className="font-medium text-foreground">No matches found</p>
            <p className="mt-0.5 text-[11px]">Try checking for typos or use different words.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((msg: MessageDto) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => onSelectMessage(msg.id)}
                className="group flex w-full cursor-pointer gap-2.5 rounded-lg border border-border/40 bg-card/60 p-2.5 text-left transition-colors hover:border-border hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
              >
                {/* Sender Avatar */}
                <Avatar className="h-7 w-7 shrink-0 rounded-md">
                  <AvatarImage
                    src={msg.senderAvatarUrl ?? undefined}
                    alt={msg.senderUsername}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-md text-[10px] font-semibold">
                    {msg.senderUsername?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Message Meta & Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between gap-1 text-xs text-muted-foreground">
                    <span className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                      {msg.senderUsername}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground/75">
                      {formatSearchDateTime(msg.createdAt)}
                    </span>
                  </div>

                  <p className="line-clamp-3 text-xs leading-relaxed break-words whitespace-pre-wrap text-muted-foreground transition-colors group-hover:text-foreground">
                    {renderHighlighted(msg.content, debouncedQuery)}
                  </p>
                </div>
              </button>
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      <span>
                        Load more results ({items.length} of {totalCount})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
