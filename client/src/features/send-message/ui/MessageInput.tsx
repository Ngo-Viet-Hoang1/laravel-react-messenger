import * as React from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useSendMessageMutation } from '@/entities/message';
import { useTypingPublisher } from '@/features/typing-indicator';
import { cn } from '@/shared/lib/utils';

export interface MessageInputProps {
  channelId?: string;
  channelName?: string;
  isDirect?: boolean;
  className?: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  channelName = 'channel',
  isDirect = false,
  className,
  disabled = false,
}) => {
  const [content, setContent] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { mutate: sendMessage } = useSendMessageMutation(channelId);
  const { handleTyping, handleStoppedTyping } = useTypingPublisher(channelId);

  const placeholderText = isDirect ? `Message ${channelName}...` : `Message in ${channelName}...`;

  const handleSend = React.useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || !channelId || disabled) return;

    sendMessage({
      content: trimmed,
      clientMessageId: crypto.randomUUID(),
    });

    handleStoppedTyping();
    setContent('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }, [content, channelId, disabled, sendMessage, handleStoppedTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      <div className="relative flex items-end gap-2 rounded-xl border border-border/80 bg-card p-2 shadow-2xs transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
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
  );
};
