export const formatMessageTime = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '';
  }
};

export const formatMessageDateHeader = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
};

export const formatSearchDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isThisYear = date.getFullYear() === now.getFullYear();

    const dateFormatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      ...(isThisYear ? {} : { year: 'numeric' }),
    }).format(date);

    const timeFormatted = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return '';
  }
};

export const formatFullDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

export const formatBytes = (bytes: number | string | null | undefined): string => {
  const n = typeof bytes === 'string' ? parseInt(bytes, 10) : Number(bytes);
  if (!n || isNaN(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};
