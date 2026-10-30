import { useEffect, useState } from 'react';

const useDebounce = <T>(value: T, delayMs: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => {
            window.clearTimeout(timer);
        };
    }, [value, delayMs]);

    return debouncedValue;
};

export default useDebounce;
