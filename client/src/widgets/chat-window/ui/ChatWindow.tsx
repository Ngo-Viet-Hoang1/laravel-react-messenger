import * as React from 'react';
import { Users, MessageSquareOff, Loader2, ArrowDown, Info } from 'lucide-react';
import { useChannelDetailQuery, CHANNEL_TYPE, ChannelAvatar } from '@/entities/channel';
import { useChannelMessagesQuery, MessageBubble, DateDivider } from '@/entities/message';
import { MessageInput } from '@/features/send-message';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { useModalStore } from '@/shared/model/useModalStore';
import { getSignalRConnection, HubConnectionState } from '@/shared/lib/signalr';
import { TypingIndicator } from '@/features/typing-indicator';
import { useChatScroll } from '../lib/useChatScroll';

export interface ChatWindowProps {
  channelId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ channelId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: channel, isLoading: isChannelLoading } = useChannelDetailQuery(channelId);
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

  const { scrollContainerRef, messagesEndRef, handleScroll, scrollToBottom, unreadBelowCount } =
    useChatScroll({
      messages,
      channelId,
      currentUserId: currentUser?.id,
      hasPreviousPage,
      isFetchingPreviousPage,
      fetchPreviousPage,
      isMessagesLoading,
    });

  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;
  const displayName = channel?.name || 'Channel';
  const openModal = useModalStore((state) => state.openModal);

  const handleOpenDetails = () => {
    if (channelId) {
      openModal({ type: 'channel-details', channelId });
    }
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
    <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
      {/* Channel Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur-xs select-none">
        <button
          type="button"
          onClick={handleOpenDetails}
          className="group flex min-w-0 items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-muted/60 cursor-pointer"
          title="View channel details & members"
        >
          <ChannelAvatar channel={channel} size="sm" />

          <div className="flex min-w-0 flex-col">
            {isChannelLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <h2 className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {displayName}
              </h2>
            )}

            {channel?.description && (
              <p className="truncate text-xs text-muted-foreground">{channel.description}</p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          {channel?.memberCount !== undefined && !isDirect && (
            <button
              type="button"
              onClick={handleOpenDetails}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer select-none"
              title="View members"
            >
              <Users className="h-3.5 w-3.5" />
              <span>{channel.memberCount} members</span>
            </button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleOpenDetails}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
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
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-3">
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

        {/* Message List */}
        {!isMessagesLoading && messages.length > 0 && (
          <div className="flex flex-col">
            {messages.map((message, index) => {
              const prevDate =
                index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
              const currDate = new Date(message.createdAt).toDateString();
              const isNewDay = !prevDate || prevDate !== currDate;

              return (
                <React.Fragment key={message.id || message.clientMessageId}>
                  {isNewDay && <DateDivider date={message.createdAt} />}
                  <MessageBubble
                    message={message}
                    isCurrentUser={currentUser?.id === message.senderId}
                  />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Pill: New messages below */}
      {unreadBelowCount > 0 && (
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
        disabled={isChannelLoading}
      />
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
