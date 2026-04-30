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
