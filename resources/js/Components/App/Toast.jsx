import { useEventBus } from '@/EventBus';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function Toast({}) {
    const [toast, setToast] = useState([]);
    const { on } = useEventBus();

    useEffect(() => {
        on('toast', (message) => {
            const uuid = uuidv4();

            setToast((oldToasts) => [...oldToasts, { id: uuid, message }]);

            setTimeout(() => {
                setToast((oldToasts) =>
                    oldToasts.filter((toast) => toast.id !== uuid),
                );
            }, 8000);
        });
    }, [on]);

    return (
        <div className="toast">
            {toast.map((toast, index) => (
                <div
                    key={toast.id}
                    className="alert alert-success rounded-md px-4 py-3 text-gray-100"
                >
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
