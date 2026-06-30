export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    email_verified_at?: string | null;
    public_key?: Record<string, unknown> | null;
    public_key_fingerprint?: string | null;
    key_version?: number;
    is_admin: boolean;
    blocked_at?: string | null;
    created_at?: string;
    updated_at?: string;
    last_message?: string | null;
    last_message_date?: string | null;
}
