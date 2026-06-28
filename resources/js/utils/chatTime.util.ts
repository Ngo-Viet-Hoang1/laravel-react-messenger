const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;
const MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY;

export type ChatTimeDisplay = {
    label: string;
    dateTime: string;
    tooltip: string;
};

const parseChatDate = (value: string): Date | null => {
    const normalizedValue = value.includes('T')
        ? value
        : value.replace(' ', 'T');
    const parsedDate = new Date(normalizedValue);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatChatTime = (
    value?: string | null,
    now: Date = new Date(),
): ChatTimeDisplay | null => {
    if (!value) return null;

    const messageDate = parseChatDate(value);

    if (!messageDate) {
        return {
            label: value,
            dateTime: value,
            tooltip: value,
        };
    }

    const minutesAgo = Math.floor(
        (now.getTime() - messageDate.getTime()) / 60_000,
    );

    let label = '';

    if (minutesAgo < 0) {
        label = new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(messageDate);
    } else if (minutesAgo < 1) {
        label = 'now';
    } else if (minutesAgo < MINUTES_IN_HOUR) {
        label = `${minutesAgo}m`;
    } else if (minutesAgo < MINUTES_IN_DAY) {
        label = `${Math.floor(minutesAgo / MINUTES_IN_HOUR)}h`;
    } else if (minutesAgo < MINUTES_IN_WEEK) {
        label = `${Math.floor(minutesAgo / MINUTES_IN_DAY)}d`;
    } else if (messageDate.getFullYear() === now.getFullYear()) {
        label = new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
        }).format(messageDate);
    } else {
        label = new Intl.DateTimeFormat('vi-VN', {
            month: '2-digit',
            year: 'numeric',
        }).format(messageDate);
    }

    return {
        label,
        dateTime: messageDate.toISOString(),
        tooltip: new Intl.DateTimeFormat('vi-VN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(messageDate),
    };
};
export const getTime = (date?: string | null) =>
    date ? new Date(date).getTime() : 0;

export const formatDateTime = (
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    },
): string => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat('en-US', options).format(date);
};
