import EmojiPickerPopover from '@/Components/App/EmojiPickerPopover';
import { useAttachments } from '@/hooks/useAttachments';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { useSendMessage } from '@/hooks/useSendMessage';
import { type ChatItem, type ChatMessage } from '@/types';
import {
    HandThumbUpIcon,
    PaperAirplaneIcon,
    PaperClipIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import React, {
    type ChangeEvent,
    Suspense,
    useCallback,
    useRef,
    useState,
} from 'react';
import AttachedItemList from './AttachedItemList';
import NewMessageInput from './NewMessageInput';

const AudioRecorder = React.lazy(() => import('./AudioRecorder'));

type Props = {
    channel: ChatItem | null;
    replyTo?: ChatMessage | null;
    onCancelReply?: () => void;
};

const MessageInput = ({
    channel = null,
    replyTo = null,
    onCancelReply,
}: Props) => {
    const [message, setMessage] = useState('');

    const { error, showError } = useErrorMessage();
    const { attachments, addFiles, remove, clear } = useAttachments(showError);
    const { send, sending, progress } = useSendMessage(showError);

    const fileRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLInputElement>(null);

    const hasMessage = message.trim().length > 0;
    const hasAttachment = attachments.length > 0;
    const canSend = hasMessage || hasAttachment;

    const handleSend = () => {
        if (sending || !canSend) return;

        send({
            channel,
            content: message.trim(),
            parentId: replyTo?.id ?? null,
            attachments,
            onSuccess: () => {
                setMessage('');
                clear();
                onCancelReply?.();
                if (fileRef.current) fileRef.current.value = '';
                if (imageRef.current) imageRef.current.value = '';
            },
        });
    };

    const handleLike = () => {
        if (sending) return;
        send({
            channel,
            content: '👍',
            parentId: replyTo?.id ?? null,
            attachments: [],
        });
    };

    const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        addFiles(files);
    };

    const handleAudioFileReady = (file: File) => addFiles([file]);

    const handleEmojiSelect = useCallback((emoji: string) => {
        setMessage((prev) => prev + emoji);
    }, []);

    return (
        <div className="flex w-full flex-col gap-2 px-1 py-2 sm:px-2">
            {progress > 0 && attachments.length > 0 ? (
                <progress
                    value={progress}
                    max={100}
                    className="progress progress-success w-full"
                />
            ) : null}

            {attachments.length > 0 ? (
                <AttachedItemList items={attachments} onRemove={remove} />
            ) : null}

            {replyTo ? (
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                            Replying to {replyTo.sender.name}
                        </div>
                        <div className="mt-0.5 line-clamp-2 break-words">
                            {replyTo.content?.trim() || 'Deleted message'}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancelReply}
                        className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    >
                        Cancel
                    </button>
                </div>
            ) : null}

            <div className="flex w-full items-end gap-1.5 sm:gap-2">
                <div className="flex shrink-0 items-center gap-0.5 pb-1 sm:gap-1">
                    <button
                        type="button"
                        aria-label="Attach generic file"
                        disabled={!channel || sending}
                        className="btn btn-circle btn-ghost relative inline-flex h-[42px] min-h-[42px] w-[42px] items-center justify-center p-0 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-slate-600"
                    >
                        <PaperClipIcon className="h-5 w-5" aria-hidden="true" />
                        <input
                            ref={fileRef}
                            type="file"
                            multiple
                            accept="*"
                            aria-label="Select files to attach"
                            disabled={!channel || sending}
                            className="absolute inset-0 z-20 cursor-pointer opacity-0"
                            onChange={handleFiles}
                        />
                    </button>

                    <button
                        type="button"
                        aria-label="Attach images or videos"
                        disabled={!channel || sending}
                        className="btn btn-circle btn-ghost relative inline-flex h-[42px] min-h-[42px] w-[42px] items-center justify-center p-0 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-slate-600"
                    >
                        <PhotoIcon className="h-5 w-5" aria-hidden="true" />
                        <input
                            ref={imageRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            aria-label="Select media to attach"
                            disabled={!channel || sending}
                            className="absolute inset-0 z-20 cursor-pointer opacity-0"
                            onChange={handleFiles}
                        />
                    </button>

                    <Suspense fallback={null}>
                        <AudioRecorder
                            onFileReady={handleAudioFileReady}
                            onError={showError}
                        />
                    </Suspense>
                </div>

                <div className="relative min-w-0 flex-1">
                    <NewMessageInput
                        value={message}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                            setMessage(e.target.value)
                        }
                        onSend={handleSend}
                        placeholder="Write a message..."
                        disabled={!channel || sending}
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <EmojiPickerPopover
                            disabled={!channel || sending}
                            onSelect={handleEmojiSelect}
                        />
                    </div>
                </div>

                <div className="shrink-0 pb-1">
                    <button
                        type="button"
                        aria-label={canSend ? 'Send message' : 'Send like'}
                        onClick={canSend ? handleSend : handleLike}
                        disabled={!channel || sending}
                        className="inline-flex aspect-square min-h-[42px] shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-600"
                    >
                        {sending ? (
                            <span
                                className="loading loading-spinner loading-xs"
                                aria-hidden="true"
                            ></span>
                        ) : canSend ? (
                            <PaperAirplaneIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        ) : (
                            <HandThumbUpIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        )}
                    </button>
                </div>
            </div>

            {error ? (
                <div
                    className="mt-1 px-1 text-xs text-red-500"
                    role="alert"
                    aria-live="polite"
                >
                    {error}
                </div>
            ) : null}
        </div>
    );
};

export default MessageInput;
