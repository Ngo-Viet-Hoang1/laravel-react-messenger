import type { User } from './auth';
import type { ChatMessage } from './chat';

export type SocketMessageEvent = {
    message: ChatMessage;
};

export type NewMessageNotification = {
    user: User;
    group_id: number | null;
    message: string;
};

export type AppEventMap = {
    'message.created': ChatMessage;
    newMessageNotification: NewMessageNotification;
    'toast.show': string;
};
