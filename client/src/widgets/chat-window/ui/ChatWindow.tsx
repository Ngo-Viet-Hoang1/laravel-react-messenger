import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Lock, Users, MessageSquareOff, Loader2, ArrowDown, Info, Search } from 'lucide-react';
import { useChannelDetailQuery, CHANNEL_TYPE, ChannelAvatar } from '@/entities/channel';
import {
  useChannelMessagesQuery,
  MessageBubble,
  DateDivider,
  MESSAGE_STATUS,
  type ChatMessage,
} from '@/entities/message';
import { MessageInput } from '@/features/send-message';
import { useSecretChatStore } from '@/features/secret-chat';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { getSignalRConnection, HubConnectionState } from '@/shared/lib/signalr';
import { TypingIndicator } from '@/features/typing-indicator';
import { MessageActionsBar, ReactionBadges } from '@/features/toggle-reaction';
import { ChannelSidePanel, type SidePanelTab } from './ChannelSidePanel';
import { cn } from '@/shared/lib/utils';
import { useChatScroll } from '../lib/useChatScroll';

export interface ChatWindowProps {
  channelId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ channelId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: channel, isLoading: isChannelLoading } = useChannelDetailQuery(channelId);

  const isSecretUnlocked = useSecretChatStore((state) =>
    channelId ? Boolean(state.keys[channelId]) : false
  );
  const lockChannel = useSecretChatStore((state) => state.lockChannel);

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useChannelMessagesQuery(channelId);

  const messages = React.useMemo(() => {
    return messagesData?.pages.flatMap((page) => page.items) ?? [];
  }, [messagesData]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // TanStack Virtualizer for high-performance 60fps rendering of thousands of messages
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 76,
    overscan: 12,
  });

  const {
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
    isViewingHistory,
    unreadBelowCount,
    highlightedMessageId,
  } = useChatScroll({
    messages,
    channelId,
    currentUserId: currentUser?.id,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    isMessagesLoading,
    scrollContainerRef,
    scrollToVirtualIndex: (idx) => {
      rowVirtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    },
  });

  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;
  const displayName = channel?.name || 'Channel';

  const [replyingToMessage, setReplyingToMessage] = React.useState<ChatMessage | null>(null);
  const [activeSideTab, setActiveSideTab] = React.useState<SidePanelTab | null>(null);

  React.useEffect(() => {
    setReplyingToMessage(null);
    setActiveSideTab(null);
  }, [channelId]);

  const toggleSideTab = (tab: SidePanelTab) => {
    setActiveSideTab((prev) => (prev === tab ? null : tab));
  };

  React.useEffect(() => {
    if (!channelId) return;

    const connection = getSignalRConnection();
    const join = async () => {
      try {
        if (connection.state === HubConnectionState.Connected) {
          await connection.invoke('JoinChannel', channelId);
        }
      } catch (err) {
        console.warn('[SignalR] Failed to join channel group:', err);
      }
    };

    join();

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        connection.invoke('LeaveChannelGroup', channelId).catch(() => {});
      }
    };
  }, [channelId]);

  return (
    <main className="relative flex flex-1 overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Channel Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur-xs select-none">
          <button
            type="button"
            onClick={() => toggleSideTab('about')}
            className="group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-muted/60"
            title="View channel details"
          >
            <ChannelAvatar channel={channel} size="sm" />

            <div className="flex min-w-0 flex-col">
              {isChannelLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <h2 className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  <span className="truncate">{displayName}</span>
                  {channel?.isSecret && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                </h2>
              )}

              {channel?.description && (
                <p className="truncate text-xs text-muted-foreground">{channel.description}</p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {channel?.isSecret && isSecretUnlocked && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => lockChannel(channel.id)}
                className="h-8 cursor-pointer gap-1.5 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                title="Lock secret chat"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </Button>
            )}

            {!channel?.isSecret && (
              <Button
                type="button"
                variant={activeSideTab === 'search' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => toggleSideTab('search')}
                className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Search in conversation"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search in conversation</span>
              </Button>
            )}

            {channel?.memberCount !== undefined && !isDirect && (
              <button
                type="button"
                onClick={() => toggleSideTab('members')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors select-none hover:bg-muted hover:text-foreground',
                  activeSideTab === 'members' && 'bg-muted text-foreground'
                )}
                title="View members"
              >
                <Users className="h-3.5 w-3.5" />
                <span>{channel.memberCount} members</span>
              </button>
            )}

            <Button
              type="button"
              variant={activeSideTab === 'about' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => toggleSideTab('about')}
              className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Channel details"
            >
              <Info className="h-4 w-4" />
              <span className="sr-only">Channel details</span>
            </Button>
          </div>
        </header>

        {/* Floating Loading Indicator for older messages (Slack/Discord style) */}
        {isFetchingPreviousPage && (
          <div className="animate-in fade-in slide-in-from-top-2 pointer-events-none absolute top-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/60 bg-background/95 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Loading older messages...</span>
          </div>
        )}

        {/* Messages Feed */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-3"
        >
          {/* Loading Skeleton */}
          {isMessagesLoading && <MessagesLoadingSkeleton />}

          {/* Empty Feed */}
          {!isMessagesLoading && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground select-none">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                <MessageSquareOff className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-foreground">No messages yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Be the first to break the ice in {displayName}!
              </p>
            </div>
          )}

          {/* Virtualized Message List */}
          {!isMessagesLoading && messages.length > 0 && (
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const index = virtualItem.index;
                const message = messages[index];
                if (!message) return null;

                const prevDate =
                  index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                const currDate = new Date(message.createdAt).toDateString();
                const isNewDay = !prevDate || prevDate !== currDate;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {isNewDay && <DateDivider date={message.createdAt} />}
                    <MessageBubble
                      message={message}
                      isCurrentUser={currentUser?.id === message.senderId}
                      isHighlighted={highlightedMessageId === message.id}
                      isSecret={channel?.isSecret}
                      onScrollToMessage={scrollToMessage}
                      actions={
                        (!message.status || message.status === MESSAGE_STATUS.SENT) && channelId ? (
                          <MessageActionsBar
                            messageId={message.id}
                            channelId={channelId}
                            reactions={message.reactions}
                            onReply={() => setReplyingToMessage(message)}
                          />
                        ) : null
                      }
                      reactions={
                        channelId ? (
                          <ReactionBadges
                            messageId={message.id}
                            channelId={channelId}
                            reactions={message.reactions}
                          />
                        ) : null
                      }
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="absolute bottom-0 h-px w-full" />
            </div>
          )}
        </div>

        {/* Jump to present button when viewing historical context */}
        {isViewingHistory && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg backdrop-blur-md transition-all select-none hover:scale-105 hover:bg-primary/90 active:scale-95"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            <span>
              {unreadBelowCount > 0
                ? `Jump to present (${unreadBelowCount} new) ↓`
                : 'Jump to present ↓'}
            </span>
          </button>
        )}

        {/* New messages pill when scrolled up in normal feed */}
        {!isViewingHistory && unreadBelowCount > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg backdrop-blur-md transition-all select-none hover:scale-105 hover:bg-primary/90 active:scale-95"
          >
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
            <span>
              {unreadBelowCount === 1
                ? '1 new message below'
                : `${unreadBelowCount} new messages below`}
            </span>
          </button>
        )}

        <TypingIndicator channelId={channelId} />

        <MessageInput
          channelId={channelId}
          channelName={displayName}
          isDirect={isDirect}
          isSecret={channel?.isSecret}
          encryptionSalt={channel?.encryptionSalt}
          disabled={isChannelLoading}
          replyingTo={replyingToMessage}
          onCancelReply={() => setReplyingToMessage(null)}
        />
      </div>

      {activeSideTab && channelId && (
        <aside className="animate-in slide-in-from-right-2 flex w-80 shrink-0 flex-col overflow-hidden border-l border-border/40 bg-card/40 duration-150 sm:w-88 md:w-96">
          <ChannelSidePanel
            channelId={channelId}
            activeTab={activeSideTab}
            onTabChange={setActiveSideTab}
            onClose={() => setActiveSideTab(null)}
            onSelectMessage={scrollToMessage}
          />
        </aside>
      )}
    </main>
  );
};

const MessagesLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 px-4 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
