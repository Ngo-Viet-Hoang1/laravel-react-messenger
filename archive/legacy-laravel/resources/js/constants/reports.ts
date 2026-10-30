import { ReportReason, ReportStatus } from '@/types/report';

export const STATUS_TABS: { value: ReportStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'dismissed', label: 'Dismissed' },
];

export const STATUS_BADGE: Record<
    ReportStatus,
    { className: string; label: string }
> = {
    pending: {
        className:
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        label: 'Pending',
    },
    reviewed: {
        className:
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        label: 'Reviewed',
    },
    dismissed: {
        className:
            'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
        label: 'Dismissed',
    },
};

export const REASON_LABELS: Record<ReportReason, string> = {
    spam: 'Spam',
    harassment: 'Harassment',
    hate_speech: 'Hate Speech',
    nsfw: 'NSFW',
    other: 'Other',
};

export const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
    { value: 'spam', label: REASON_LABELS.spam },
    { value: 'harassment', label: REASON_LABELS.harassment },
    { value: 'hate_speech', label: REASON_LABELS.hate_speech },
    { value: 'nsfw', label: REASON_LABELS.nsfw },
    { value: 'other', label: REASON_LABELS.other },
];
