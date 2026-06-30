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

export type ParentMessage = {
    id: number;
    content: string | null;
    sender: User;
    attachments: MessageAttachment[];
};

export type MessageReactionGroup = {
    emoji: string;
    count: number;
    user_ids: number[];
};

export type ChatMessage = DbMessage & {
    sender: User;
    parent: ParentMessage | null;
    attachments: MessageAttachment[];
    reactions: MessageReactionGroup[];
};

export type ChatMessageCollection = PaginatedResponse<ChatMessage>;

export type ChatItem = {
    id: number;
    name: string | null;
    description?: string | null;
    type: 'direct' | 'group';
    is_e2ee_enabled: boolean;

    peer_user_id?: number | null;
    peer_is_admin?: boolean | null;

    avatar_url?: string | null;
    owner_id?: number | null;
    users?: ChatMember[];
    user_ids?: number[];

    blocked_at?: string | null;

    last_message?: string | null;
    last_message_date?: string | null;
    last_read_message_id?: number | null;
    unread_count?: number;

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
