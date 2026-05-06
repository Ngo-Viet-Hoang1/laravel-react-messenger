import type { AttachmentKind, AttachmentSource } from '@/types';
import { ChatItem, ChatMessage } from '@/types';

export function getChannelName(conversation: ChatItem, userId: number): string {
    if (conversation.is_user) {
        return `message.user.${[userId, conversation.id].sort((a, b) => a - b).join('-')}`;
    }
    return `message.group.${conversation.id}`;
}

export function isMessageForConversation(
    message: ChatMessage,
    conversation: ChatItem,
    currentUserId: number,
): boolean {
    const senderId = Number(message.sender_id);
    const receiverId = Number(message.receiver_id);
    const groupId = Number(message.group_id);

    if (conversation.is_group) {
        return groupId === conversation.id;
    }

    if (conversation.is_user) {
        const isOutgoing =
            senderId === currentUserId && receiverId === conversation.id;
        const isIncoming =
            senderId === conversation.id && receiverId === currentUserId;
        return isOutgoing || isIncoming;
    }

    return false;
}

const getMimeType = (file?: AttachmentSource | File | null): string => {
    if (!file) return '';
    return file.type || ('mime' in file ? (file.mime ?? '') : '');
};

export const isImage = (file?: AttachmentSource | File | null) =>
    getMimeType(file).startsWith('image/');
export const isVideo = (file?: AttachmentSource | File | null) =>
    getMimeType(file).startsWith('video/');
export const isAudio = (file?: AttachmentSource | File | null) =>
    getMimeType(file).startsWith('audio/');
export const isPDF = (file?: AttachmentSource | File | null) =>
    getMimeType(file) === 'application/pdf';

export const getAttachmentKind = (
    file: AttachmentSource | File,
): AttachmentKind => {
    if (isImage(file)) return 'image';
    if (isVideo(file)) return 'video';
    if (isAudio(file)) return 'audio';
    return 'file';
};

export const formatFileSize = (size: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;

    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }

    return `${size.toFixed(2)} ${units[i]}`;
};

export const isPreviewable = (file?: AttachmentSource | File | null): boolean =>
    isImage(file) || isVideo(file) || isAudio(file) || isPDF(file);

export const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
