import type { ChatMessage } from './chat';

export type MessageCreatedEvent = {
    message: ChatMessage;
};

export type MessageDeletedEvent = {
    message: ChatMessage;
    newLastMessage: ChatMessage | null;
};

export type ChannelDeletedEvent = {
    id: number;
    name: string;
};

export type AppEventMap = {
    'message.created': ChatMessage;
    'message.deleted': MessageDeletedEvent;

    'channel.deleted': ChannelDeletedEvent;

    'toast.show': string;
};
