import { MessageAttachment } from '@/types';
import { useCallback, useState } from 'react';

type PreviewState = {
    startIndex: number;
    attachments: MessageAttachment[];
} | null;

type UseAttachmentsPreviewReturn = {
    isOpen: boolean;
    preview: PreviewState;
    open: (attachments: MessageAttachment[], index: number) => void;
    close: () => void;
};

const useAttachmentsPreview = (): UseAttachmentsPreviewReturn => {
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState<PreviewState>(null);

    const open = useCallback(
        (attachments: MessageAttachment[], index: number) => {
            setPreview({ startIndex: index, attachments });
            setIsOpen(true);
        },
        [],
    );

    const close = useCallback(() => setIsOpen(false), []);

    return { isOpen, preview, open, close };
};

export default useAttachmentsPreview;
