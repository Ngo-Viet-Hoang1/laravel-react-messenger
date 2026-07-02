import * as React from 'react';
import { Users, MessageSquareOff } from 'lucide-react';
import { useChannelDetailQuery, CHANNEL_TYPE, ChannelAvatar } from '@/entities/channel';
import { useChannelMessagesQuery, MessageBubble, DateDivider } from '@/entities/message';
import { MessageInput } from '@/features/send-message';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { Skeleton } from '@/shared/ui/skeleton';

export interface ChatWindowProps {
  channelId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ channelId }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { data: channel, isLoading: isChannelLoading } = useChannelDetailQuery(channelId);
  const { data: messages = [], isLoading: isMessagesLoading } = useChannelMessagesQuery(channelId);

  // Stick-to-bottom auto-scroll on new messages
  React.useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;
  const displayName = channel?.name || 'Channel';

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Channel Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur-xs select-none">
        <div className="flex min-w-0 items-center gap-2.5">
          <ChannelAvatar channel={channel} size="sm" />

          <div className="flex min-w-0 flex-col">
            {isChannelLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <h2 className="truncate text-sm font-bold text-foreground">{displayName}</h2>
            )}

            {channel?.description && (
              <p className="truncate text-xs text-muted-foreground">{channel.description}</p>
            )}
          </div>
        </div>

        {channel?.memberCount !== undefined && !isDirect && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
            <Users className="h-3.5 w-3.5" />
            <span>{channel.memberCount} members</span>
          </div>
        )}
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto py-3">
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
