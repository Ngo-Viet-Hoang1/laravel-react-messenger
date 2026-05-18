import { useEventBus } from '@/EventBus';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import UserAvatar from './UserAvatar';

export default function NewMessageNotification({}) {
    const [toast, setToast] = useState([]);
    const { on } = useEventBus();

    useEffect(() => {
        const off = on(
            'newMessageNotification',
            ({ message, user, group_id }) => {
                const uuid = uuidv4();

                setToast((oldToasts) => [
                    ...oldToasts,
                    { id: uuid, message, user, group_id },
                ]);

                setTimeout(() => {
                    setToast((oldToasts) =>
                        oldToasts.filter((toast) => toast.id !== uuid),
                    );
                }, 8000);
            },
        );
        return () => {
            if (typeof off === 'function') {
                off();
            }
        };
    }, [on]);

    return (
        <div className="toast toast-center toast-top min-w-[280px]">
            {toast.map((toast, index) => (
                <div
                    key={toast.id}
                    className="alert alert-success rounded-md px-4 py-3 text-gray-100"
                >
                    <Link
                        href={
                            toast.group_id
                                ? route('chat.group', toast.group_id)
                                : route('chat.user', toast.user.id)
                        }
                        className="flex items-center gap-2"
                    >
                        <UserAvatar
                            user={toast.user}
                            className="mr-2 h-6 w-6"
                        />
                        <span>{toast.message}</span>
                    </Link>
                </div>
            ))}
        </div>
    );
}
