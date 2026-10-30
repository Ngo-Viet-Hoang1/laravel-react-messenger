import type { AppEventMap } from '@/types';
import {
    PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
} from 'react';

type EventName = keyof AppEventMap;
type EventHandler = (payload: unknown) => void;

type EventBusContextValue = {
    emit: <K extends EventName>(name: K, data: AppEventMap[K]) => void;
    on: <K extends EventName>(
        name: K,
        callback: (data: AppEventMap[K]) => void,
    ) => () => void;
};

const EventBusContext = createContext<EventBusContextValue | undefined>(
    undefined,
);

export const EventBusProvider = ({ children }: PropsWithChildren) => {
    const listenersRef = useRef<Partial<Record<EventName, EventHandler[]>>>({});

    const emit = useCallback(
        <K extends EventName>(name: K, data: AppEventMap[K]) => {
            listenersRef.current[name]?.forEach((handler) => handler(data));
        },
        [],
    );

    const on = useCallback(
        <K extends EventName>(
            name: K,
            callback: (data: AppEventMap[K]) => void,
        ) => {
            const handler: EventHandler = (payload) => {
                callback(payload as AppEventMap[K]);
            };

            const listeners: EventHandler[] = listenersRef.current[name] ?? [];
            listeners.push(handler);
            listenersRef.current[name] = listeners;

            return () => {
                const currentListeners = listenersRef.current[name];
                if (!currentListeners) return;

                listenersRef.current[name] = currentListeners.filter(
                    (registered) => registered !== handler,
                );

                if (listenersRef.current[name]?.length === 0) {
                    delete listenersRef.current[name];
                }
            };
        },
        [],
    );

    const value = useMemo(() => ({ emit, on }), [emit, on]);

    return (
        <EventBusContext.Provider value={value}>
            {children}
        </EventBusContext.Provider>
    );
};

export const useEventBus = (): EventBusContextValue => {
    const context = useContext(EventBusContext);
    if (!context) {
        throw new Error('useEventBus must be used within an EventBusProvider');
    }
    return context;
};
