import { User } from '@/types';
import axios, { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import useDebounce from './useDebounce';

type UseUserSearchReturn = {
    results: User[];
    isLoading: boolean;
};

const DEBOUNCE_MS = 300;

const useUserSearch = (query: string): UseUserSearchReturn => {
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const cancelTokenRef = useRef<CancelTokenSource | null>(null);

    const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

    useEffect(() => {
        if (!debouncedQuery) {
            cancelTokenRef.current?.cancel();
            setResults([]);
            setIsLoading(false);
            return;
        }

        const search = async (): Promise<void> => {
            cancelTokenRef.current?.cancel();
            const source = axios.CancelToken.source();
            cancelTokenRef.current = source;

            setIsLoading(true);

            try {
                const { data } = await axios.get<User[]>(route('users.index'), {
                    params: { q: debouncedQuery },
                    cancelToken: source.token,
                });
                setResults(data);
                setIsLoading(false);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    setIsLoading(false);
                }
            }
        };

        void search();

        return () => {
            cancelTokenRef.current?.cancel();
        };
    }, [debouncedQuery]);

    // Show loading state immediately when user starts typing
    useEffect(() => {
        if (query.trim()) {
            setIsLoading(true);
        }
    }, [query]);

    return { results, isLoading };
};

export default useUserSearch;
