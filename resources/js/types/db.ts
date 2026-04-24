export type User = {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    email_verified_at?: string | null;
    is_admin: boolean;
    blocked_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type Conversation = {
    id: number;
    user_id1: number;
    user_id2: number;
    last_message_id?: number | null;
    created_at: string;
    updated_at: string;
};

export type Message = {
    id: number;
    message?: string | null;
    sender_id: number;
    receiver_id?: number | null;
    group_id?: number | null;
    conversation_id?: number | null;
    created_at: string;
    updated_at: string;
};

export type MessageAttachment = {
    id: number;
    message_id: number;
    name: string;
    path: string;
    mime: string;
    size: number;
    created_at: string;
    updated_at: string;
};

export type Group = {
    id: number;
    name: string;
    description?: string | null;
    owner_id: number;
    last_message_id?: number | null;
    created_at: string;
    updated_at: string;
};

export type GroupUser = {
    id: number;
    group_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
};
