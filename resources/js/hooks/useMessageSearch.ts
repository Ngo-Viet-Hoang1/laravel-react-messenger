import { ChatMessage, PaginationLinks } from '@/types';
import axios, { CancelTokenSource } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

type SearchState = {
    results: ChatMessage[];
    isLoading: boolean;
    hasMore: boolean;
    currentPage: number;
    totalResults: number;
};

const INITIAL_STATE: SearchState = {
    results: [],
    isLoading: false,
    hasMore: false,
    currentPage: 0,
    totalResults: 0,
};

const DEBOUNCE_MS = 350;

type UseMessageSearchReturn = {
    query: string;
    setQuery: (value: string) => void;
    results: ChatMessage[];
    isLoading: boolean;
    hasMore: boolean;
    totalResults: number;
    loadMore: () => void;
    reset: () => void;
};

export default function useMessageSearch(
    channelId: number | null,
): UseMessageSearchReturn {
    const [query, setQuery] = useState('');
    const [state, setState] = useState<SearchState>(INITIAL_STATE);

    const cancelRef = useRef<CancelTokenSource | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchResults = useCallback(
        async (searchQuery: string, page: number, append: boolean) => {
            if (!channelId || searchQuery.trim().length === 0) {
                setState(INITIAL_STATE);
                return;
            }

            cancelRef.current?.cancel();
            const source = axios.CancelToken.source();
            cancelRef.current = source;

            setState((prev) => ({ ...prev, isLoading: true }));

            try {
                const { data } = await axios.get<{
                    data: ChatMessage[];
                    links: PaginationLinks;
                    meta: { total: number; current_page: number };
                }>(route('channels.messages.search', channelId), {
                    params: { query: searchQuery, page, t: Date.now() },
                    cancelToken: source.token,
                });

                setState((prev) => ({
                    results: append
                        ? [...prev.results, ...data.data]
                        : data.data,
                    isLoading: false,
                    hasMore: data.links.next !== null,
                    currentPage: data.meta.current_page,
                    totalResults: data.meta.total,
                }));
            } catch (error) {
                if (!axios.isCancel(error)) {
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            }
        },
        [channelId],
    );

    // Debounced search on query change
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.trim().length === 0) {
            setState(INITIAL_STATE);
            return;
        }

        debounceRef.current = setTimeout(() => {
            fetchResults(query, 1, false);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, fetchResults]);

    // Reset when channel changes
    useEffect(() => {
        setQuery('');
        setState(INITIAL_STATE);
    }, [channelId]);

    const loadMore = useCallback((): void => {
        if (state.isLoading || !state.hasMore) return;
        fetchResults(query, state.currentPage + 1, true);
    }, [
        state.isLoading,
        state.hasMore,
        state.currentPage,
        query,
        fetchResults,
    ]);

    const reset = useCallback((): void => {
        cancelRef.current?.cancel();
        setQuery('');
        setState(INITIAL_STATE);
    }, []);

    return {
        query,
        setQuery,
        results: state.results,
        isLoading: state.isLoading,
        hasMore: state.hasMore,
        totalResults: state.totalResults,
        loadMore,
        reset,
    };
}
