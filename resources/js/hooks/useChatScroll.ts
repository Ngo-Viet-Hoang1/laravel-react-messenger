import { useCallback, useRef } from 'react';

const SCROLL_NEAR_BOTTOM_THRESHOLD = 150;

type UseChatScrollReturn = {
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    isNearBottomRef: React.MutableRefObject<boolean>;
    handleScroll: () => void;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
};

const useChatScroll = (): UseChatScrollReturn => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // [Vercel Rule] advanced-use-latest — use ref to avoid stale closure in callbacks
    const isNearBottomRef = useRef(true);

    // flex-col-reverse: scrollTop=0 = bottom visual
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        isNearBottomRef.current = el.scrollTop < SCROLL_NEAR_BOTTOM_THRESHOLD;
    }, []);

    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'smooth') => {
            scrollContainerRef.current?.scrollTo({ top: 0, behavior });
        },
        [],
    );

    return {
        scrollContainerRef,
        isNearBottomRef,
        handleScroll,
        scrollToBottom,
    };
};

export default useChatScroll;
