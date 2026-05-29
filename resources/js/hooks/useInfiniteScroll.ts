import { useEffect, useRef } from 'react';

type UseInfiniteScrollReturn = {
    triggerRef: React.RefObject<HTMLDivElement>;
};

const useInfiniteScroll = (
    loadOlderMessages: () => Promise<void>,
    hasLoadedAllMessages: boolean,
): UseInfiniteScrollReturn => {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (hasLoadedAllMessages) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) loadOlderMessages();
        });

        if (triggerRef.current) observer.observe(triggerRef.current);

        return () => observer.disconnect();
    }, [loadOlderMessages, hasLoadedAllMessages]);

    return { triggerRef };
};

export default useInfiniteScroll;
