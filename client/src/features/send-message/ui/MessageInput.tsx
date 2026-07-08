import * as React from 'react';
import { SendHorizontal, Reply, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ChatMessage, useSendMessageMutation } from '@/entities/message';
import { useTypingPublisher } from '@/features/typing-indicator';
import { cn } from '@/shared/lib/utils';

export interface MessageInputProps {
  channelId?: string;
  channelName?: string;
  isDirect?: boolean;
  className?: string;
  disabled?: boolean;
  replyingTo?: Pick<ChatMessage, 'id' | 'senderUsername' | 'content'> | null;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  channelName = 'channel',
  isDirect = false,
  className,
  disabled = false,
  replyingTo,
  onCancelReply,
}) => {
  const [content, setContent] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { mutate: sendMessage } = useSendMessageMutation(channelId);
  const { handleTyping, handleStoppedTyping } = useTypingPublisher(channelId);

  const placeholderText = isDirect ? `Message ${channelName}...` : `Message in ${channelName}...`;

  React.useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSend = React.useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || !channelId || disabled) return;

    sendMessage({
      content: trimmed,
      clientMessageId: crypto.randomUUID(),
      parentMessageId: replyingTo?.id,
    });

    onCancelReply?.();
    handleStoppedTyping();
    setContent('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }, [content, channelId, disabled, replyingTo, sendMessage, onCancelReply, handleStoppedTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && replyingTo) {
      e.preventDefault();
      onCancelReply?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (val.trim()) {
      handleTyping();
    } else {
      handleStoppedTyping();
    }

    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  const isSendDisabled = disabled || !content.trim();

  return (
    <div className={cn('relative bg-background px-4 pt-1 pb-4 select-none', className)}>
      <div className="relative flex flex-col rounded-xl border border-border/80 bg-card shadow-2xs transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="animate-in fade-in slide-in-from-bottom-1 flex items-center justify-between border-b border-border/50 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate">
              <Reply className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="font-semibold text-foreground">
                Replying to {replyingTo.senderUsername}:
              </span>
              <span className="truncate text-muted-foreground/80">{replyingTo.content}</span>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-2 cursor-pointer rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              title="Cancel reply (Esc)"
              aria-label="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholderText}
            rows={1}
            className="max-h-40 min-h-9.5 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          />

          <Button
            type="button"
            size="icon"
            disabled={isSendDisabled}
            onClick={handleSend}
            aria-label="Send message"
            className="h-8 w-8 shrink-0 cursor-pointer rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
