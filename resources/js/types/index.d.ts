export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    email_verified_at?: string | null;
    is_admin: boolean;
    blocked_at?: string | null;
    created_at?: string;
    updated_at?: string;
    last_message?: string | null;
    last_message_date?: string | null;
}

export type ChatMember = Pick<
    User,
    'id' | 'name' | 'avatar_url' | 'is_admin' | 'blocked_at'
>;

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    conversations?: ChatItem[];
    selectedConversation?: ChatItem | null;
};

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
