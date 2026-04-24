import { ChatItem } from '@/types';
import {
    FaceSmileIcon,
    HandThumbUpIcon,
    PaperAirplaneIcon,
    PaperClipIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { ChangeEvent, useState } from 'react';
import NewMessageInput from './NewMessageInput';

type Props = {
    conversation: ChatItem | null;
};

const MessageInput = ({ conversation = null }: Props) => {
    const [message, setMessage] = useState('');
    const [inputErrorMessage, setInputErrorMessage] = useState('');
    const [messageSending, setMessageSending] = useState(false);
    const hasMessage = message.trim().length > 0;
    const attachmentButtonClass =
        'btn btn-circle btn-ghost relative inline-flex h-[42px] min-h-[42px] w-[42px] items-center justify-center p-0 text-slate-500 transition-all duration-150 hover:scale-[1.04] hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-slate-600';

    const sendMessage = async (content: string, clearInput = false) => {
        if (!conversation) {
            setInputErrorMessage('Please select a conversation first');
            setTimeout(() => setInputErrorMessage(''), 3000);
            return;
        }

        if (content.trim() === '') return;

        const formData = new FormData();
        formData.append('message', content);

        if (conversation.is_user) {
            formData.append('receiver_id', conversation.id.toString());
        } else if (conversation.is_group) {
            formData.append('group_id', conversation.id.toString());
        }

        setMessageSending(true);

        try {
            await axios.post(route('message.store'), formData, {
                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) return;

                    const progress = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100,
                    );
                    console.log('Upload Progress: ' + progress + '%');
                },
            });

            if (clearInput) {
                setMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setInputErrorMessage('Failed to send message. Please try again.');
            setTimeout(() => setInputErrorMessage(''), 3000);
        } finally {
            setMessageSending(false);
        }
    };

    const onSendClick = async () => {
        if (messageSending || !hasMessage) return;
        await sendMessage(message.trim(), true);
    };

    const onLikeClick = async () => {
        if (messageSending) return;
        await sendMessage('👍');
    };

    return (
        <div className="w-full px-1 py-2 sm:px-2">
            <div className="flex w-full items-stretch gap-1.5 sm:gap-2">
                <div className="flex shrink-0 items-center gap-0.5 self-center sm:gap-1">
                    <button
                        type="button"
                        disabled={!conversation || messageSending}
                        className={attachmentButtonClass}
                    >
                        <PaperClipIcon className="h-5 w-5" />
                        <input
                            type="file"
                            multiple
                            disabled={!conversation || messageSending}
                            className="absolute inset-0 z-20 cursor-pointer opacity-0"
                        />
                    </button>

                    <button
                        type="button"
                        disabled={!conversation || messageSending}
                        className={attachmentButtonClass}
                    >
                        <PhotoIcon className="h-5 w-5" />
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            disabled={!conversation || messageSending}
                            className="absolute inset-0 z-20 cursor-pointer opacity-0"
                        />
                    </button>
                </div>

                <div className="relative min-w-0 flex-1 self-end">
                    <NewMessageInput
                        value={message}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                            setMessage(e.target.value)
                        }
                        onSend={onSendClick}
                        placeholder="Write a message..."
                        disabled={!conversation || messageSending}
                    />

                    <button
                        type="button"
                        disabled={!conversation || messageSending}
                        className="btn btn-circle btn-ghost absolute right-2 top-1/2 inline-flex h-8 min-h-8 w-8 -translate-y-1/2 items-center justify-center p-0 text-slate-500 transition-all duration-150 hover:scale-[1.04] hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-slate-600"
                    >
                        <FaceSmileIcon className="h-5 w-5" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={hasMessage ? onSendClick : onLikeClick}
                    disabled={!conversation || messageSending}
                    className="inline-flex aspect-square min-h-[42px] shrink-0 items-center justify-center self-stretch rounded-full border border-slate-300 bg-white text-slate-600 transition-all duration-150 hover:-translate-y-px hover:scale-[1.04] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-600"
                >
                    {messageSending ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : hasMessage ? (
                        <PaperAirplaneIcon className="h-5 w-5" />
                    ) : (
                        <HandThumbUpIcon className="h-5 w-5" />
                    )}
                </button>
            </div>

            {inputErrorMessage && (
                <div className="mt-1 px-1 text-xs text-red-500">
                    {inputErrorMessage}
                </div>
            )}
        </div>
    );
};

export default MessageInput;
