import * as React from 'react';
import { UserAvatar } from '@/entities/user';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatMessageTime } from '@/shared/lib/formatters';
import { isEncrypted } from '@/shared/lib/crypto/passphraseCrypto';
import { useSecretChatStore } from '@/features/secret-chat';
import { MESSAGE_STATUS, type ChatMessage } from '../model/types';
import { MessageAttachments } from './MessageAttachments';

export interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  className?: string;
  isHighlighted?: boolean;
  actions?: React.ReactNode;
  reactions?: React.ReactNode;
  onScrollToMessage?: (messageId: string) => void;
  isSecret?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  className,
  isHighlighted,
  actions,
  reactions,
  onScrollToMessage,
  isSecret,
}) => {
  const isOptimistic = message.status === MESSAGE_STATUS.SENDING;
  const isFailed = message.status === MESSAGE_STATUS.FAILED;
  const timeFormatted = React.useMemo(
    () => formatMessageTime(message.createdAt),
    [message.createdAt]
  );

  const isMsgEncrypted = React.useMemo(
    () => isEncrypted(message.content),
    [message.content]
  );

  const isUnlocked = useSecretChatStore((state) =>
    Boolean(state.keys[message.channelId])
  );
  const cachedDecrypted = useSecretChatStore(
    (state) => state.decryptedCache[message.id]
  );
  const decryptMessageContent = useSecretChatStore(
    (state) => state.decryptMessageContent
  );

  React.useEffect(() => {
    if (isMsgEncrypted && isUnlocked && !cachedDecrypted && message.content) {
      void decryptMessageContent(message.id, message.content, message.channelId);
    }
  }, [isMsgEncrypted, isUnlocked, cachedDecrypted, message.id, message.content, message.channelId, decryptMessageContent]);

  const displayContent = React.useMemo(() => {
    if (!message.content) return null;
    if (!isMsgEncrypted) return message.content;

    if (!isUnlocked) {
      return (
        <span className="text-xs text-muted-foreground italic select-none">
          [Encrypted message]
        </span>
      );
    }

    if (cachedDecrypted) {
      if (cachedDecrypted.startsWith('[Decryption failed')) {
        return (
          <span className="text-xs text-destructive italic select-none">
            {cachedDecrypted}
          </span>
        );
      }
      return cachedDecrypted;
    }

    return (
      <span className="text-xs text-muted-foreground italic select-none">
        [Encrypted message]
      </span>
    );
  }, [message.content, isMsgEncrypted, isUnlocked, cachedDecrypted]);

  const replyDisplayContent = React.useMemo(() => {
    if (!message.replyTo) return null;
    const raw = message.replyTo.content;
    if (isEncrypted(raw)) {
      const cached = useSecretChatStore.getState().decryptedCache[message.replyTo.id];
      return cached && !cached.startsWith('[Decryption failed') ? cached : '[Encrypted message]';
    }
    return raw || (message.replyTo ? '[Attachment]' : '');
  }, [message.replyTo]);

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        'group relative flex w-full gap-3 px-4 py-2 transition-colors duration-700 hover:bg-muted/40',
        isHighlighted && 'bg-primary/8',
        isOptimistic && 'opacity-65',
        isFailed && 'bg-destructive/5 hover:bg-destructive/10',
        className
      )}
    >
      <div className="shrink-0 pt-0.5">
        <UserAvatar
          user={{
            username: message.senderUsername,
            avatarUrl: message.senderAvatarUrl,
          }}
          size="md"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {message.replyTo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onScrollToMessage?.(message.replyTo!.id);
            }}
            className="mb-1 flex max-w-lg cursor-pointer items-center gap-1.5 rounded-md border-l-2 border-primary/70 bg-muted/40 px-2 py-0.5 text-left text-xs text-muted-foreground transition-colors select-none hover:bg-muted/70"
            title="Jump to quoted message"
          >
            <span className="shrink-0 font-semibold text-primary">
              {message.replyTo.senderUsername}
            </span>
            <span className="truncate">{replyDisplayContent}</span>
          </button>
        )}

        <div className="flex items-baseline gap-2">
          <span className="cursor-pointer truncate text-sm font-bold text-foreground hover:underline">
            {message.senderUsername}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground/80 select-none">
            {timeFormatted}
          </span>

          {isCurrentUser && (
            <span className="shrink-0 select-none">
              {isOptimistic && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                  <Clock className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span>sending...</span>
                </span>
              )}
              {isFailed && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>failed</span>
                </span>
              )}
            </span>
          )}
        </div>

        {displayContent && (
          <div className="mt-0.5 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/90 select-text">
            {displayContent}
          </div>
        )}

        <MessageAttachments attachments={message.attachments} isSecret={isSecret} />

        {reactions}
      </div>

      {actions && (
        <div className="pointer-events-none absolute -top-3 right-4 flex items-center rounded-lg border border-border/60 bg-background/95 px-1 py-0.5 opacity-0 shadow-xs backdrop-blur-md transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 has-[[data-state=open]]:pointer-events-auto has-[[data-state=open]]:opacity-100">
          {actions}
        </div>
      )}
    </div>
  );
};
