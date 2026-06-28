export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    email_verified_at?: string | null;
    is_admin: boolean;
    is_premium: boolean;
    blocked_at?: string | null;
    premium_started_at?: string | null;
    premium_expires_at?: string | null;
    created_at?: string;
    updated_at?: string;
    last_message?: string | null;
    last_message_date?: string | null;
}
