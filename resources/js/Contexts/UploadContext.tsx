import { useEventBus } from '@/EventBus';
import {
    isCancelError,
    sendChunkedUpload,
    type UploadTask,
} from '@/utils/chunkedUpload';
import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react';

type UploadContextType = {
    uploads: UploadTask[];
    uploadFile: (
        file: File,
        channelId: number,
        content: string,
        parentId?: number | null,
    ) => Promise<void>;
    cancelUpload: (id: string) => void;
    clearUpload: (id: string) => void;
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { emit } = useEventBus();
    const [uploads, setUploads] = useState<UploadTask[]>([]);
    const controllers = useRef<Record<string, AbortController>>({});

    const updateTask = useCallback(
        (id: string, patch: Partial<UploadTask>): void => {
            setUploads((prev) =>
                prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
            );
        },
        [],
    );

    const cancelUpload = useCallback(
        (id: string) => {
            controllers.current[id]?.abort();
            delete controllers.current[id];
            updateTask(id, { status: 'cancelled' });
        },
        [updateTask],
    );

    const clearUpload = useCallback((id: string) => {
        setUploads((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const uploadFile = useCallback(
        async (
            file: File,
            channelId: number,
            content: string,
            parentId: number | null = null,
        ) => {
            const id = crypto.randomUUID();
            const controller = new AbortController();
            controllers.current[id] = controller;

            setUploads((prev) => [
                ...prev,
                {
                    id,
                    name: file.name,
                    size: file.size,
                    progress: 0,
                    status: 'uploading',
                    channelId,
                },
            ]);

            try {
                const message = await sendChunkedUpload(
                    file,
                    id,
                    channelId,
                    content,
                    parentId,
                    controller.signal,
                    (progress) => updateTask(id, { progress }),
                );

                updateTask(id, { status: 'completed' });
                if (message?.id) emit('message.created', message);
                setTimeout(() => clearUpload(id), 4000);
            } catch (err) {
                updateTask(id, {
                    status: isCancelError(err) ? 'cancelled' : 'failed',
                });
            } finally {
                delete controllers.current[id];
            }
        },
        [emit, clearUpload, updateTask],
    );

    return (
        <UploadContext.Provider
            value={{ uploads, uploadFile, cancelUpload, clearUpload }}
        >
            {children}
        </UploadContext.Provider>
    );
};

export const useUploads = (): UploadContextType => {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error('useUploads must be used within an UploadProvider');
    }
    return context;
};
