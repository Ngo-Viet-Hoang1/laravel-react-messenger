import type { User } from './auth';
import type {
    Message as DbMessage,
    MessageAttachment as DbMessageAttachment,
} from './db';
import type { PaginatedResponse } from './pagination';

export type ChatMember = Pick<
    User,
    'id' | 'name' | 'avatar_url' | 'is_admin' | 'blocked_at'
>;

export type MessageAttachment = DbMessageAttachment & {
    url: string;
};

export type ChatMessage = Omit<
    DbMessage,
    'receiver_id' | 'group_id' | 'conversation_id'
> & {
    receiver_id: number | null;
    group_id: number | null;
    conversation_id: number | null;
    sender: User;
    receiver: User | null;
    attachments: MessageAttachment[];
};

export type ChatMessageCollection = PaginatedResponse<ChatMessage>;

export type ChatItem = {
    id: number;
    name: string;
    description?: string | null;

    is_group: boolean;
    is_user: boolean;
    is_admin?: boolean;
    avatar_url?: string | null;

    owner_id?: number;

    users?: ChatMember[];
    user_ids?: number[];

    blocked_at?: string | null;

    last_message?: string | null;
    last_message_date?: string | null;

    created_at?: string;
    updated_at?: string;
};

export type AttachmentKind = 'image' | 'video' | 'audio' | 'file';

export type AttachmentSource = {
    type?: string | null;
    mime?: string | null;
    name?: string | null;
    size?: number | null;
};

export type AttachedItem = AttachmentSource & {
    file: File;
    url: string;
    kind: AttachmentKind;
};
