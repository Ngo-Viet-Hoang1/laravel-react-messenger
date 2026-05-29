import { useEventBus } from '@/EventBus';
import { useEffect, useState } from 'react';

const Toast = () => {
    const [toasts, setToasts] = useState<
        {
            uuid: string;
            message: string;
        }[]
    >([]);
    const { on } = useEventBus();

    useEffect(() => {
        const offToast = on('toast.show', (message: string) => {
            const uuid = crypto.randomUUID();
            setToasts((prev) => [...prev, { uuid, message }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.uuid !== uuid));
            }, 3000);
        });

        return () => offToast();
    }, [on]);

    return (
        <div className="toast toast-end toast-top">
            {toasts.map((t) => (
                <div key={t.uuid} className="alert alert-success text-white">
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
};

export default Toast;
