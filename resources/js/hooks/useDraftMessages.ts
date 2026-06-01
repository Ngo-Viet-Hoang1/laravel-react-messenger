import { useCallback, useEffect, useState } from 'react';

const draftKey = (channelId: number): string => `draft:${channelId}`;

type UseDraftMessageReturn = {
    value: string;
    setValue: (content: string) => void;
    clearDraft: () => void;
};

const useDraftMessage = (channelId: number | null): UseDraftMessageReturn => {
    const [value, setValueState] = useState<string>(() => {
        if (!channelId) return '';
        return localStorage.getItem(draftKey(channelId)) ?? '';
    });

    useEffect(() => {
        const saved = channelId
            ? (localStorage.getItem(draftKey(channelId)) ?? '')
            : '';
        setValueState(saved);
    }, [channelId]);

    const setValue = useCallback(
        (content: string): void => {
            setValueState(content);
            if (!channelId) return;
            if (content.trim()) {
                localStorage.setItem(draftKey(channelId), content);
            } else {
                localStorage.removeItem(draftKey(channelId));
            }
        },
        [channelId],
    );

    const clearDraft = useCallback((): void => {
        setValueState('');
        if (channelId) localStorage.removeItem(draftKey(channelId));
    }, [channelId]);

    return { value, setValue, clearDraft };
};

export default useDraftMessage;
