import { type AttachedItem } from '@/types';
import { getAttachmentKind } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;

export const useAttachments = (onError: (msg: string) => void) => {
    const [items, setItems] = useState<AttachedItem[]>([]);

    const itemsRef = useRef(items);
    itemsRef.current = items;

    const addFiles = useCallback(
        (files: File[]) => {
            setItems((prev) => {
                if (prev.length + files.length > MAX_FILES) {
                    onError(`Max ${MAX_FILES} files allowed`);
                    return prev;
                }

                const newItems: AttachedItem[] = [];

                for (const file of files) {
                    if (file.size > MAX_FILE_SIZE) {
                        onError(`${file.name} exceeds 10MB`);
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
                    return prev;
                }

                return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
        },
        [onError],
    );

    const remove = useCallback((idx: number) => {
        setItems((prev) => {
            const item = prev[idx];
            if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
            return prev.filter((_, i) => i !== idx);
        });
    }, []);

    const clear = useCallback(() => {
        setItems((prev) => {
            prev.forEach((item) => {
                if (item?.url.startsWith('blob:'))
                    URL.revokeObjectURL(item.url);
            });
            return [];
        });
    }, []);

    useEffect(() => {
        return () => {
            itemsRef.current.forEach((item) => {
                if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
            });
        };
    }, []);

    return { items, addFiles, remove, clear };
};
