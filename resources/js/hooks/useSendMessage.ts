import { useEventBus } from '@/EventBus';
import { type AttachedItem, type ChatItem, type ChatMessage } from '@/types';
import axios from 'axios';
import { useCallback, useState } from 'react';

type SendArgs = {
    conversation: ChatItem | null;
    content: string;
    attachments: AttachedItem[];
    onSuccess?: () => void;
};

export const useSendMessage = (onError: (msg: string) => void) => {
    const { emit } = useEventBus();
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);

    const send = useCallback(
        async ({ conversation, content, attachments, onSuccess }: SendArgs) => {
            if (!conversation) {
                onError('Please select a conversation first');
                return;
            }

            if (content.trim() === '' && attachments.length === 0) return;

            const formData = new FormData();
            formData.append('message', content);

            if (conversation.is_user) {
                formData.append('receiver_id', conversation.id.toString());
            } else if (conversation.is_group) {
                formData.append('group_id', conversation.id.toString());
            }

            attachments.forEach((item) => {
                formData.append('attachments[]', item.file);
            });

            setSending(true);

            try {
                const { data: newMessage } = await axios.post<ChatMessage>(
                    route('message.store'),
                    formData,
                    {
                        onUploadProgress: (progressEvent) => {
                            if (!progressEvent.total) return;
                            const currentProgress = Math.round(
                                (progressEvent.loaded / progressEvent.total) *
                                    100,
                            );
                            setProgress(currentProgress);
                        },
                    },
                );

                if (newMessage?.id) {
                    emit('message.created', newMessage);
                }

                onSuccess?.();
            } catch {
                onError('Failed to send message. Please try again.');
            } finally {
                setSending(false);
                setProgress(0);
            }
        },
        [emit, onError],
    );

    return { send, sending, progress };
};
