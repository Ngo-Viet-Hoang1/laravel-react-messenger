import { ChatItem } from '@/types';
import {
    createContext,
    lazy,
    ReactNode,
    Suspense,
    useContext,
    useState,
} from 'react';

const LazyCreateGroupModal = lazy(
    () => import('@/Components/App/CreateOrEditGroupModal'),
);

type GroupModalContextType = {
    openModal: (group?: ChatItem | null) => void;
    closeModal: () => void;
};

const GroupModalContext = createContext<GroupModalContextType | undefined>(
    undefined,
);

export const GroupModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<ChatItem | null>(null);

    const openModal = (group?: ChatItem | null) => {
        setGroupToEdit(group ?? null);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setTimeout(() => setGroupToEdit(null), 300);
    };

    return (
        <GroupModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <Suspense fallback={null}>
                <LazyCreateGroupModal
                    isOpen={isOpen}
                    group={groupToEdit}
                    onClose={closeModal}
                />
            </Suspense>
        </GroupModalContext.Provider>
    );
};

export const useGroupModal = () => {
    const context = useContext(GroupModalContext);
    if (context === undefined) {
        throw new Error(
            'useGroupModal must be used within a GroupModalProvider',
        );
    }
    return context;
};
