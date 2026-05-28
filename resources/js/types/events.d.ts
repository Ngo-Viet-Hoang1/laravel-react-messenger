import type { ChatMessage } from './chat';

export type MessageCreatedEvent = {
    message: ChatMessage;
};

export type ChannelDeletedEvent = {
    id: number;
    name: string;
};

export type AppEventMap = {
    'message.created': ChatMessage;
    'message.deleted': {
        message: ChatMessage;
        newLastMessage: ChatMessage | null;
    };

    'channel.deleted': ChannelDeletedEvent;

    'toast.show': string;
};
