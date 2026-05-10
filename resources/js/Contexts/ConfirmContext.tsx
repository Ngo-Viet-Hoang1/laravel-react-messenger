import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import DangerButton from '../Components/Breeze/DangerButton';
import PrimaryButton from '../Components/Breeze/PrimaryButton';
import SecondaryButton from '../Components/Breeze/SecondaryButton';

type ConfirmOptions = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = (opts: ConfirmOptions): Promise<boolean> => {
        if (isOpen) return Promise.resolve(false);
        setOptions(opts);
        setIsOpen(true);
        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolver.current) resolver.current(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolver.current) resolver.current(false);
    };

    useEffect(() => {
        return () => {
            resolver.current = null;
        };
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            <Dialog
                open={isOpen}
                as="div"
                className="relative z-50 focus:outline-none"
                onClose={handleCancel}
            >
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="data-closed:scale-95 data-closed:opacity-0 w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all duration-200 ease-out dark:bg-slate-800"
                        >
                            <DialogTitle
                                as="h3"
                                className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                            >
                                {options?.title}
                            </DialogTitle>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {options?.message}
                                </p>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <SecondaryButton onClick={handleCancel}>
                                    {options?.cancelText || 'Cancel'}
                                </SecondaryButton>

                                {options?.isDanger ? (
                                    <DangerButton onClick={handleConfirm}>
                                        {options?.confirmText || 'Confirm'}
                                    </DangerButton>
                                ) : (
                                    <PrimaryButton onClick={handleConfirm}>
                                        {options?.confirmText || 'Confirm'}
                                    </PrimaryButton>
                                )}
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
