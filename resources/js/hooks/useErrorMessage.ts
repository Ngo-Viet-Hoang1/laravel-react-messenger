import { useCallback, useState } from 'react';

export const useErrorMessage = () => {
    const [error, setError] = useState('');

    const showError = useCallback((msg: string) => {
        setError(msg);
        const t = setTimeout(() => setError(''), 3000);
        return () => clearTimeout(t);
    }, []);

    return { error, showError };
};
