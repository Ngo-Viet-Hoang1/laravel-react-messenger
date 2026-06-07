import type { ChatMessage } from './chat';

export type MessageCreatedEvent = {
    message: ChatMessage;
};

export type MessageDeletedEvent = {
    message: ChatMessage;
    newLastMessage: ChatMessage | null;
};

export type MessagesClearedEvent = {
    channel_id: number;
};

export type ChannelDeletedEvent = {
    id: number;
    name: string;
};

export type ChannelReadUpdatedEvent = {
    channel_id: number;
    user_id: number;
    last_read_message_id: number | null;
};

export type AppEventMap = {
    'message.created': ChatMessage;
    'message.deleted': MessageDeletedEvent;
    'messages.cleared': MessagesClearedEvent;

    'channel.deleted': ChannelDeletedEvent;
    'channel.read.updated': ChannelReadUpdatedEvent;

    'toast.show': string;
};
