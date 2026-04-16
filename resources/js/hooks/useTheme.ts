import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) ?? 'system';
    });

    useEffect(() => {
        const root = document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);

        root.classList.toggle('dark', isDark);

        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (theme !== 'system') return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            document.documentElement.classList.toggle('dark', media.matches);
        };

        media.addEventListener('change', handler);

        return () => media.removeEventListener('change', handler);
    }, [theme]);

    return { theme, setTheme };
}
