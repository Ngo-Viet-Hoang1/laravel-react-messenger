import { User } from '@/types';
import {
    createContext,
    lazy,
    ReactNode,
    Suspense,
    useContext,
    useState,
} from 'react';

const LazyCreateUserModal = lazy(
    () => import('@/Components/App/CreateOrEditUserModal'),
);

type UserModalContextType = {
    openModal: (user?: User | null) => void;
    closeModal: () => void;
};

const UserModalContext = createContext<UserModalContextType | undefined>(
    undefined,
);

export const UserModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const openModal = (user?: User | null) => {
        setUserToEdit(user ?? null);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setTimeout(() => setUserToEdit(null), 300);
    };

    return (
        <UserModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <Suspense fallback={null}>
                <LazyCreateUserModal
                    isOpen={isOpen}
                    user={userToEdit}
                    onClose={closeModal}
                />
            </Suspense>
        </UserModalContext.Provider>
    );
};

export const useUserModal = () => {
    const context = useContext(UserModalContext);
    if (context === undefined) {
        throw new Error('useUserModal must be used within a UserModalProvider');
    }
    return context;
};
