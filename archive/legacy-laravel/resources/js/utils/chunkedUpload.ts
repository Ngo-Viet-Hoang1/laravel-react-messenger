import { ChatMessage } from '@/types';
import axios from 'axios';

// ── Types ──

export type UploadTask = {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'completed' | 'failed' | 'cancelled';
    channelId: number;
};

export type UploadStatusConfig = {
    label: string;
    progressClass: string;
    value: number;
    opaque?: boolean;
};

type ChunkResponse = { status: string; progress?: number; path?: string };

// ── Constants ──

const CHUNK_SIZE = 5 * 1024 * 1024; // chunk 5MB
const MAX_CONCURRENT = 3; // 3 worker upload at the same time

export const UPLOAD_STATUS_CONFIG: Record<
    UploadTask['status'],
    UploadStatusConfig
> = {
    uploading: { label: '', progressClass: 'progress-info', value: 0 },
    completed: {
        label: ' • Complete',
        progressClass: 'progress-success',
        value: 100,
    },
    failed: {
        label: ' • Failed',
        progressClass: 'progress-error',
        value: 100,
        opaque: true,
    },
    cancelled: {
        label: ' • Cancelled',
        progressClass: 'progress-warning',
        value: 100,
        opaque: true,
    },
};

// ── Helpers ──

function buildChunkFormData(
    file: File,
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
): FormData {
    const blob = file.slice(
        chunkIndex * CHUNK_SIZE,
        (chunkIndex + 1) * CHUNK_SIZE,
    );
    const mime = file.type || 'application/octet-stream';

    const fd = new FormData();
    fd.append('file_uuid', uploadId);
    fd.append('chunk_index', String(chunkIndex));
    fd.append('total_chunks', String(totalChunks));
    fd.append('name', file.name);
    fd.append('size', String(file.size));
    fd.append('mime', mime);
    fd.append('file', blob, file.name);
    return fd;
}

function buildMessageFormData(
    file: File,
    mergedPath: string,
    content: string,
    parentId: number | null,
): FormData {
    const mime = file.type || 'application/octet-stream';

    const fd = new FormData();
    if (content.trim()) fd.append('content', content);
    if (parentId) fd.append('parent_id', String(parentId));
    fd.append('uploaded_attachments[0][path]', mergedPath);
    fd.append('uploaded_attachments[0][name]', file.name);
    fd.append('uploaded_attachments[0][mime]', mime);
    fd.append('uploaded_attachments[0][size]', String(file.size));
    return fd;
}

async function uploadAllChunks(
    file: File,
    uploadId: string,
    totalChunks: number,
    signal: AbortSignal,
    onProgress: (percent: number) => void,
): Promise<string> {
    const queue = Array.from({ length: totalChunks }, (_, i) => i);
    let completed = 0;
    let mergedPath = '';

    const worker = async (): Promise<void> => {
        while (queue.length > 0) {
            if (signal.aborted) throw new Error('cancelled');

            const i = queue.shift()!;
            const fd = buildChunkFormData(file, uploadId, i, totalChunks);
            const { data } = await axios.post<ChunkResponse>(
                route('messages.upload-chunk'),
                fd,
                { signal },
            );

            if (data.status === 'completed' && data.path) {
                mergedPath = data.path;
            }

            completed++;
            onProgress(Math.round((completed / totalChunks) * 100));
        }
    };

    const workerCount = Math.min(MAX_CONCURRENT, totalChunks);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    if (!mergedPath) {
        throw new Error('Upload complete but path not returned by server');
    }
    return mergedPath;
}

// ── Public API ──

export async function sendChunkedUpload(
    file: File,
    uploadId: string,
    channelId: number,
    content: string,
    parentId: number | null,
    signal: AbortSignal,
    onProgress: (percent: number) => void,
): Promise<ChatMessage> {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const mergedPath = await uploadAllChunks(
        file,
        uploadId,
        totalChunks,
        signal,
        onProgress,
    );

    const fd = buildMessageFormData(file, mergedPath, content, parentId);
    const { data } = await axios.post<ChatMessage>(
        route('channels.messages.store', channelId),
        fd,
        { signal },
    );
    return data;
}

export function isCancelError(err: unknown): boolean {
    return (
        axios.isCancel(err) ||
        (err instanceof Error && err.message === 'cancelled')
    );
}
