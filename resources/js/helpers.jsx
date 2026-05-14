const toDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatMessageDateLong = (date) => {
    const now = new Date();
    const inputDate = toDate(date);
    if (!inputDate) {
        return '';
    }

    if (isToday(inputDate)) {
        return inputDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } else if (isYesterday(inputDate)) {
        return (
            'Yesterday ' +
            inputDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })
        );
    } else if (inputDate.getFullYear() === now.getFullYear()) {
        return inputDate.toLocaleDateString([], {
            month: 'short',
            day: '2-digit',
        });
    } else {
        return inputDate.toLocaleDateString();
    }
};

export const FormatMessageDateShort = (date) => {
    const now = new Date();
    const inputDate = toDate(date);
    if (!inputDate) {
        return '';
    }

    if (isToday(inputDate)) {
        return inputDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } else if (isYesterday(inputDate)) {
        return 'Yesterday';
    } else if (inputDate.getFullYear() === now.getFullYear()) {
        return inputDate.toLocaleDateString([], {
            day: '2-digit',
            month: 'short',
        });
    } else {
        return inputDate.toLocaleDateString();
    }
};

export const isToday = (date) => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

export const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    );
};

const getMimeParts = (attachment) => {
    if (!attachment) return [];
    if (typeof attachment === 'string') return [];
    const mime = attachment.mime || attachment.type;
    if (!mime || typeof mime !== 'string') return [];
    return mime.split('/');
};

export const isImage = (attachment) => {
    const mime = getMimeParts(attachment);
    return (mime[0] || '').toLowerCase() === 'image';
};

export const isVideo = (attachment) => {
    const mime = getMimeParts(attachment);
    return (mime[0] || '').toLowerCase() === 'video';
};

export const isAudio = (attachment) => {
    const mime = getMimeParts(attachment);
    return (mime[0] || '').toLowerCase() === 'audio';
};

export const isPDF = (attachment) => {
    const mime = getMimeParts(attachment);
    return (
        (mime[0] || '').toLowerCase() === 'application' &&
        (mime[1] || '').toLowerCase() === 'pdf'
    );
};

export const isPreviewable = (attachment) => {
    return (
        isImage(attachment) ||
        isVideo(attachment) ||
        isAudio(attachment) ||
        isPDF(attachment)
    );
};

export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const units = ['Bytes', 'KB', 'MB', 'GB'];

    let i = 0;
    let size = bytes;
    while (size >= k && i < units.length - 1) {
        size /= k;
        i++;
    }
    return parseFloat(size.toFixed(dm)) + ' ' + units[i];
};
