export type User = {
    id: number;
    name: string;
    email: string;
    password: string;
    public_key: Record<string, unknown> | null;
    public_key_fingerprint: string | null;
    key_version: number | null;
    avatar_url?: string | null;
    email_verified_at?: string | null;
    is_admin: boolean;
    blocked_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type Channel = {
    id: number;
    type: 'direct' | 'group';
    is_e2ee_enabled: boolean;
    direct_key: string | null;
    name: string | null;
    description: string | null;
    owner_id: number | null;
    last_message_id: number | null;
    created_at: string;
    updated_at: string;
};

export type ChannelMember = {
    id: number;
    channel_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
};

export type Message = {
    id: number;
    channel_id: number;
    sender_id: number;
    parent_id: number | null;
    content: string | null;
    deleted_at?: string | null;

    is_encrypted: boolean;
    iv: string | null;
    ciphertext: string | null;

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
    storage_disk: string;
    thumbnail_path: string | null;
    created_at: string;
    updated_at: string;
};
