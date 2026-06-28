import type { AttachmentKind, AttachmentSource } from '@/types';
import { ChatItem } from '@/types';
import React from 'react';

export const getChannelName = (channel: ChatItem): string =>
    `message.channel.${channel.id}`;

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

export const revokeBlobUrl = (url: string): void => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
};

export const reactNodeToText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (!node) return '';
    if (Array.isArray(node)) return node.map(reactNodeToText).join('');
    if (React.isValidElement(node)) {
        const el = node as React.ReactElement<{ children?: React.ReactNode }>;
        return reactNodeToText(el.props.children);
    }
    return '';
};

export const cx = (...classes: (string | undefined | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};
