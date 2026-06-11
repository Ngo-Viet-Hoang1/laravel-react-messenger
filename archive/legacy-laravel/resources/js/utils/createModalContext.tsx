import {
    ComponentType,
    createContext,
    LazyExoticComponent,
    ReactNode,
    Suspense,
    useContext,
    useState,
} from 'react';

export type ModalBaseProps<TEntity> = {
    isOpen: boolean;
    entity: TEntity | null;
    onClose: () => void;
};

export function createModalContext<TEntity>(
    displayName: string,
    LazyModal: LazyExoticComponent<ComponentType<ModalBaseProps<TEntity>>>,
) {
    type ContextValue = {
        openModal: (entity?: TEntity | null) => void;
        closeModal: () => void;
    };

    const Context = createContext<ContextValue | undefined>(undefined);

    const Provider = ({ children }: { children: ReactNode }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [entity, setEntity] = useState<TEntity | null>(null);

        const openModal = (e?: TEntity | null) => {
            setEntity(e ?? null);
            setIsOpen(true);
        };

        const closeModal = () => {
            setIsOpen(false);
            setTimeout(() => setEntity(null), 300);
        };

        return (
            <Context.Provider value={{ openModal, closeModal }}>
                {children}
                <Suspense fallback={null}>
                    <LazyModal
                        isOpen={isOpen}
                        entity={entity}
                        onClose={closeModal}
                    />
                </Suspense>
            </Context.Provider>
        );
    };

    const useModal = () => {
        const ctx = useContext(Context);
        if (!ctx)
            throw new Error(
                `use${displayName}Modal must be used within ${displayName}ModalProvider`,
            );
        return ctx;
    };

    return { Provider, useModal } as const;
}
