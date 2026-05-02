import { useEventBus } from '@/EventBus';
import { User } from '@/types';
import { useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';

const Toast = () => {
    const [toasts, setToasts] = useState<
        {
            uuid: string;
            message: string;
            user?: User;
            group_id?: number | null;
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

        const offNewMessageNoti = on('newMessageNotification', (data) => {
            const { user, message, group_id } = data;
            const notiMessage = `${user.name}: ${message}`;
            const uuid = crypto.randomUUID();
            setToasts((prev) => [
                ...prev,
                { uuid, message: notiMessage, group_id, user },
            ]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.uuid !== uuid));
            }, 5000);
        });

        return () => {
            offToast();
            offNewMessageNoti();
        };
    }, [on]);

    return (
        <div className="toast toast-end toast-top">
            {toasts.map((t) => (
                <div key={t.uuid} className="alert alert-success text-white">
                    <span>
                        {t.user && <UserAvatar user={t.user} />}
                        {` `} {t.message}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default Toast;
