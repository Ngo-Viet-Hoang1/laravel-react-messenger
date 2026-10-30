import * as React from 'react';

/**
 * Custom hook to debounce fast-changing values (e.g. search inputs).
 * Prevents redundant queries and rapid re-renders.
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
