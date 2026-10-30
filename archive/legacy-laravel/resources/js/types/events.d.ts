import type { ChatMessage, MessageReactionGroup } from './chat';

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

export type ChannelReadUpdatedEvent = {
    channel_id: number;
    user_id: number;
    last_read_message_id: number | null;
};

export type MessageReactionUpdatedEvent = {
    message_id: number;
    channel_id: number;
    reactions: MessageReactionGroup[];
};

export type AppEventMap = {
    'message.created': ChatMessage;
    'message.deleted': MessageDeletedEvent;
    'message.reaction.updated': MessageReactionUpdatedEvent;

    'channel.deleted': ChannelDeletedEvent;
    'channel.read.updated': ChannelReadUpdatedEvent;

    'toast.show': string;
};
