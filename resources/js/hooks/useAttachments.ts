import { type AttachedItem } from '@/types';
import { getAttachmentKind, revokeBlobUrl } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 2048 * 1024 * 1024; // 2GB
const MAX_TOTAL_SIZE = 5096 * 1024 * 1024; // 5GB

export const useAttachments = (onError: (msg: string) => void) => {
    const [attachments, setAttachments] = useState<AttachedItem[]>([]);

    const itemsRef = useRef(attachments);
    itemsRef.current = attachments;

    const addFiles = useCallback(
        (files: File[]) => {
            setAttachments((prev) => {
                if (prev.length + files.length > MAX_FILES) {
                    onError(`Max ${MAX_FILES} files allowed`);
                    return prev;
                }

                const newItems: AttachedItem[] = [];

                for (const file of files) {
                    if (file.size > MAX_FILE_SIZE) {
                        onError(`${file.name} exceeds 2GB`);
                        continue;
                    }

                    const isDuplicate =
                        prev.some(
                            (item) =>
                                item.file.name === file.name &&
                                item.file.size === file.size,
                        ) ||
                        newItems.some(
                            (item) =>
                                item.file.name === file.name &&
                                item.file.size === file.size,
                        );

                    if (isDuplicate) {
                        onError(`${file.name} already attached`);
                        continue;
                    }

                    newItems.push({
                        file,
                        url: URL.createObjectURL(file),
                        mime: file.type,
                        size: file.size,
                        name: file.name,
                        kind: getAttachmentKind(file),
                    });
                }

                const totalSize = [...prev, ...newItems].reduce(
                    (sum, item) => sum + (item.size ?? 0),
                    0,
                );

                if (totalSize > MAX_TOTAL_SIZE) {
                    onError('Total size exceeds 25MB');
                    newItems.forEach((item) => URL.revokeObjectURL(item.url));
                    return prev;
                }

                return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
        },
        [onError],
    );

    const remove = useCallback((idx: number) => {
        setAttachments((prev) => {
            revokeBlobUrl(prev[idx]?.url);
            return prev.filter((_, i) => i !== idx);
        });
    }, []);

    const clear = useCallback(() => {
        setAttachments((prev) => {
            prev.forEach((item) => {
                revokeBlobUrl(item.url);
            });
            return [];
        });
    }, []);

    useEffect(() => {
        return () => {
            itemsRef.current.forEach((item) => {
                revokeBlobUrl(item.url);
            });
        };
    }, []);

    return { attachments, addFiles, remove, clear };
};
