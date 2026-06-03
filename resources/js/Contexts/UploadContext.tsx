import { useEventBus } from '@/EventBus';
import { ChatMessage } from '@/types';
import axios from 'axios';
import React, { createContext, useContext, useState, useCallback, useRef, PropsWithChildren } from 'react';

export type UploadTask = {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'completed' | 'failed' | 'cancelled';
    channelId: number;
};

type UploadContextType = {
    uploads: UploadTask[];
    uploadFile: (
        file: File,
        channelId: number,
        content: string,
        parentId?: number | null
    ) => Promise<void>;
    cancelUpload: (id: string) => void;
    clearUpload: (id: string) => void;
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export const UploadProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { emit } = useEventBus();
    const [uploads, setUploads] = useState<UploadTask[]>([]);
    const abortControllers = useRef<Record<string, AbortController>>({});

    const cancelUpload = useCallback((id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
            delete abortControllers.current[id];
        }
        setUploads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'cancelled' } : t))
        );
    }, []);

    const clearUpload = useCallback((id: string) => {
        setUploads((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const uploadFile = useCallback(
        async (
            file: File,
            channelId: number,
            content: string,
            parentId: number | null = null
        ) => {
            const uploadId = crypto.randomUUID();
            const controller = new AbortController();
            abortControllers.current[uploadId] = controller;

            const newTask: UploadTask = {
                id: uploadId,
                name: file.name,
                size: file.size,
                progress: 0,
                status: 'uploading',
                channelId,
            };

            setUploads((prev) => [...prev, newTask]);

            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let mergedPath = '';

            try {
                for (let i = 0; i < totalChunks; i++) {
                    if (controller.signal.aborted) {
                        throw new Error('cancelled');
                    }

                    const start = i * CHUNK_SIZE;
                    const end = Math.min(start + CHUNK_SIZE, file.size);
                    const chunkBlob = file.slice(start, end);

                    const formData = new FormData();
                    formData.append('file_uuid', uploadId);
                    formData.append('chunk_index', String(i));
                    formData.append('total_chunks', String(totalChunks));
                    formData.append('name', file.name);
                    formData.append('size', String(file.size));
                    formData.append('mime', file.type || 'application/octet-stream');
                    formData.append('file', chunkBlob, file.name);

                    const chunkRoute = route('messages.upload-chunk');

                    const response = await axios.post<{
                        status: string;
                        progress?: number;
                        path?: string;
                    }>(chunkRoute, formData, {
                        signal: controller.signal,
                    });

                    const currentProgress = Math.round(((i + 1) / totalChunks) * 100);
                    setUploads((prev) =>
                        prev.map((t) =>
                            t.id === uploadId
                                ? { ...t, progress: currentProgress }
                                : t
                        )
                    );

                    if (response.data.status === 'completed' && response.data.path) {
                        mergedPath = response.data.path;
                    }
                }

                if (!mergedPath) {
                    throw new Error('Upload complete but path not returned by server');
                }

                const msgFormData = new FormData();
                if (content.trim()) {
                    msgFormData.append('content', content);
                }
                if (parentId) {
                    msgFormData.append('parent_id', String(parentId));
                }
                msgFormData.append('uploaded_attachments[0][path]', mergedPath);
                msgFormData.append('uploaded_attachments[0][name]', file.name);
                msgFormData.append('uploaded_attachments[0][mime]', file.type || 'application/octet-stream');
                msgFormData.append('uploaded_attachments[0][size]', String(file.size));

                const storeRoute = route('channels.messages.store', channelId);

                const { data: newMessage } = await axios.post<ChatMessage>(
                    storeRoute,
                    msgFormData,
                    { signal: controller.signal }
                );

                setUploads((prev) =>
                    prev.map((t) =>
                        t.id === uploadId ? { ...t, status: 'completed' } : t
                    )
                );

                if (newMessage?.id) {
                    emit('message.created', newMessage);
                }

                setTimeout(() => {
                    clearUpload(uploadId);
                }, 4000);

            } catch (err: any) {
                if (axios.isCancel(err) || err.message === 'cancelled') {
                    setUploads((prev) =>
                        prev.map((t) =>
                            t.id === uploadId ? { ...t, status: 'cancelled' } : t
                        )
                    );
                } else {
                    setUploads((prev) =>
                        prev.map((t) =>
                            t.id === uploadId ? { ...t, status: 'failed' } : t
                        )
                    );
                }
            } finally {
                delete abortControllers.current[uploadId];
            }
        },
        [emit, clearUpload]
    );

    return (
        <UploadContext.Provider
            value={{ uploads, uploadFile, cancelUpload, clearUpload }}
        >
            {children}
        </UploadContext.Provider>
    );
};

export const useUploads = () => {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error('useUploads must be used within an UploadProvider');
    }
    return context;
};
