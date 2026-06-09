import { User } from '@/types';
import axios, { CancelTokenSource } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

type UseUserSearchReturn = {
    results: User[];
    isLoading: boolean;
};

const DEBOUNCE_MS = 300;

const useUserSearch = (query: string): UseUserSearchReturn => {
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const cancelTokenRef = useRef<CancelTokenSource | null>(null);
    const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
        null,
    );

    const search = useCallback((q: string) => {
        cancelTokenRef.current?.cancel();
        const source = axios.CancelToken.source();
        cancelTokenRef.current = source;

        setIsLoading(true);

        axios
            .get<User[]>(route('users.index'), {
                params: { q },
                cancelToken: source.token,
            })
            .then(({ data }) => {
                setResults(data);
                setIsLoading(false);
            })
            .catch((error) => {
                if (!axios.isCancel(error)) {
                    setIsLoading(false);
                }
            });
    }, []);

    useEffect(() => {
        if (timerRef.current) {
            globalThis.clearTimeout(timerRef.current);
        }

        const trimmed = query.trim();

        if (!trimmed) {
            cancelTokenRef.current?.cancel();
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        timerRef.current = globalThis.setTimeout(() => {
            search(trimmed);
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) {
                globalThis.clearTimeout(timerRef.current);
            }
        };
    }, [query, search]);

    useEffect(() => {
        return () => {
            cancelTokenRef.current?.cancel();
        };
    }, []);

    return { results, isLoading };
};

export default useUserSearch;
