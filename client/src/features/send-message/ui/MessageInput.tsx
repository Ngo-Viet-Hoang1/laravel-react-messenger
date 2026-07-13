import { ChatMessage, useSendMessageMutation } from '@/entities/message';
import { useTypingPublisher } from '@/features/typing-indicator';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Loader2, Paperclip, Reply, SendHorizontal, X } from 'lucide-react';
import * as React from 'react';
import { useAttachmentUpload } from '../model/useAttachmentUpload';
import { AttachmentPreviewList } from './AttachmentPreviewList';

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
  const [isDragging, setIsDragging] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { mutate: sendMessage } = useSendMessageMutation(channelId);
  const { handleTyping, handleStoppedTyping } = useTypingPublisher(channelId);

  const {
    items: attachments,
    addFiles,
    removeAttachment,
    clearAttachments,
    isUploading,
    completedAttachmentIds,
    hasAttachments,
  } = useAttachmentUpload(channelId);

  const placeholderText = isDirect ? `Message ${channelName}...` : `Message in ${channelName}...`;

  React.useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSend = React.useCallback(() => {
    const trimmed = content.trim();
    if (
      (!trimmed && completedAttachmentIds.length === 0) ||
      !channelId ||
      disabled ||
      isUploading
    ) {
      return;
    }

    const optimisticAttachments = attachments
      .filter((att) => att.status === 'completed' && att.attachmentId)
      .map((att) => {
        let mediaUrl = att.previewUrl || '';
        if (
          att.file &&
          (att.file.type.startsWith('video/') ||
            att.file.type.startsWith('audio/') ||
            att.file.type.startsWith('image/'))
        ) {
          mediaUrl = URL.createObjectURL(att.file);
        }

        return {
          id: att.attachmentId!,
          channelId,
          messageId: null,
          fileName: att.name,
          fileSizeBytes: att.size,
          contentType: att.contentType,
          url: mediaUrl,
          thumbnailUrl: att.previewUrl || null,
          width: att.width ?? null,
          height: att.height ?? null,
          durationSeconds: att.durationSeconds ?? null,
          createdAt: new Date().toISOString(),
        };
      });

    sendMessage({
      content: trimmed,
      clientMessageId: crypto.randomUUID(),
      parentMessageId: replyingTo?.id,
      attachmentIds: completedAttachmentIds.length > 0 ? completedAttachmentIds : null,
      optimisticAttachments: optimisticAttachments.length > 0 ? optimisticAttachments : undefined,
    });

    onCancelReply?.();
    clearAttachments();
    handleStoppedTyping();
    setContent('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }, [
    content,
    channelId,
    disabled,
    isUploading,
    completedAttachmentIds,
    attachments,
    replyingTo,
    sendMessage,
    onCancelReply,
    clearAttachments,
    handleStoppedTyping,
  ]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      addFiles(Array.from(e.clipboardData.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const isSendDisabled =
    disabled || isUploading || (!content.trim() && completedAttachmentIds.length === 0);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn('relative bg-background px-4 pt-1 pb-4 select-none', className)}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        className={cn(
          'relative flex flex-col rounded-xl border border-border/80 bg-card shadow-2xs transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15',
          isDragging && 'border-primary bg-primary/5 ring-2 ring-primary/20'
        )}
      >
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="animate-in fade-in slide-in-from-bottom-1 flex items-center justify-between border-b border-border/50 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate">
              <Reply className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="font-semibold text-foreground">
                Replying to {replyingTo.senderUsername}:
              </span>
              <span className="truncate text-muted-foreground/80">
                {replyingTo.content || '[Attachment]'}
              </span>
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

        {/* Attachment Previews */}
        {hasAttachments && (
          <AttachmentPreviewList items={attachments} onRemove={removeAttachment} />
        )}

        <div className="flex items-end gap-2 p-2">
          {/* Attachment Paperclip Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            title="Attach file, image, or video"
            className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
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
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
