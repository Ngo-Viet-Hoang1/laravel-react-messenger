import type { User } from './auth';
import type { MessageAttachment } from './chat';

export type ReportReason =
    | 'spam'
    | 'harassment'
    | 'hate_speech'
    | 'nsfw'
    | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export type ReportedMessage = {
    id: number;
    content: string | null;
    channel_id: number;
    sender_id: number;
    sender: User;
    created_at: string;
    attachments?: MessageAttachment[];
};

export type MessageReport = {
    id: number;
    reason: ReportReason;
    note: string | null;
    status: ReportStatus;
    message: ReportedMessage;
    reporter: User;
    reviewer: User | null;
    reviewed_at: string | null;
    sibling_reports?: MessageReport[];
    reports_count?: number;
    created_at: string;
};
