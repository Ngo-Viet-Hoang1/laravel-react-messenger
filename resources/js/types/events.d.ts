import type { User } from './auth';
import type { ChatMessage } from './chat';
import { NewMessageNotification } from './events.d';

export type SocketMessageEvent = {
    message: ChatMessage;
};

export type GroupDeletedEvent = {
    id: number;
    name: string;
};

export type NewMessageNotification = {
    user: User;
    group_id: number | null;
    message: string;
};

export type AppEventMap = {
    'message.created': ChatMessage;
    'message.deleted': {
        message: ChatMessage;
        newLastMessage: ChatMessage | null;
    };
    NewMessageNotification: NewMessageNotification;
    'toast.show': string;
    'group.deleted': GroupDeletedEvent;
};
