import { useE2EE } from '@/Contexts/E2EEContext';
import { useEventBus } from '@/EventBus';
import { type AttachedItem, type ChatItem, type ChatMessage } from '@/types';
import axios from 'axios';
import { useCallback, useState } from 'react';

type SendArgs = {
    channel: ChatItem | null;
    content: string;
    parentId?: number | null;
    attachments: AttachedItem[];
    onSuccess?: () => void;
};

export const useSendMessage = (onError: (msg: string) => void) => {
    const { emit } = useEventBus();
    const { encryptForUser } = useE2EE();

    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);

    const send = useCallback(
        async ({
            channel,
            content,
            parentId,
            attachments,
            onSuccess,
        }: SendArgs) => {
            if (!channel) {
                onError('Please select a channel first');
                return;
            }

            if (content.trim() === '' && attachments.length === 0) return;

            if (channel.is_e2ee_enabled && channel.peer_user_id == null) {
                onError(
                    'This Secret Chat is missing peer information. Please contact support.',
                );
                return;
            }

            const formData = new FormData();
            let encryptedContent: string | null = null;

            if (channel.is_e2ee_enabled && content.trim().length > 0) {
                const encrypted = await encryptForUser(
                    channel.peer_user_id!,
                    content.trim(),
                );

                if (!encrypted) {
                    onError(
                        'Could not encrypt message. Please try again or check your connection.',
                    );
                    return;
                }

                formData.append('is_encrypted', '1');
                formData.append('iv', encrypted.iv);
                formData.append('ciphertext', encrypted.ciphertext);
                encryptedContent = content.trim(); // kept locally to inject into emitted event
            } else {
                formData.append('content', content);
            }

            if (parentId) {
                formData.append('parent_id', String(parentId));
            }

            attachments.forEach((item) => {
                formData.append('attachments[]', item.file);
            });

            setSending(true);

            try {
                const { data: newMessage } = await axios.post<ChatMessage>(
                    route('channels.messages.store', channel.id),
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
                    // For own encrypted messages: server returns content=null.
                    // Inject the plaintext we already know (we just encrypted it)
                    // so local UI (and useChannels sidebar preview) shows it immediately.
                    const messageToEmit =
                        encryptedContent !== null
                            ? { ...newMessage, content: encryptedContent }
                            : newMessage;

                    emit('message.created', messageToEmit);
                }

                onSuccess?.();
            } catch {
                onError('Failed to send message. Please try again.');
            } finally {
                setSending(false);
                setProgress(0);
            }
        },
        [emit, onError, encryptForUser],
    );

    return { send, sending, progress };
};
