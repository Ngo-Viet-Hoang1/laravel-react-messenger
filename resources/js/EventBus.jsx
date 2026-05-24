import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

export const EventBusContext = createContext(null);

export const EventBusProvider = ({ children }) => {
    const listeners = useRef(new Map());

    const off = useCallback((name, callback) => {
        const callbacks = listeners.current.get(name);

        if (!callbacks) {
            return;
        }

        callbacks.delete(callback);

        if (callbacks.size === 0) {
            listeners.current.delete(name);
        }
    }, []);

    const on = useCallback(
        (name, callback) => {
            const callbacks = listeners.current.get(name) ?? new Set();
            callbacks.add(callback);
            listeners.current.set(name, callbacks);

            return () => off(name, callback);
        },
        [off],
    );

    const emit = useCallback((name, data) => {
        listeners.current.get(name)?.forEach((callback) => {
            callback(data);
        });
    }, []);

    const value = useMemo(() => ({ emit, off, on }), [emit, off, on]);

    return (
        <EventBusContext.Provider value={value}>
            {children}
        </EventBusContext.Provider>
    );
};

export const useEventBus = () => {
    const eventBus = useContext(EventBusContext);

    if (!eventBus) {
        throw new Error('useEventBus must be used within EventBusProvider');
    }

    return eventBus;
};
