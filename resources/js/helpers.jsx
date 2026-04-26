export const formatMessageDateLong = (date) => {
    const now = new Date();
    const inputĐate = new Date(date);

    if (isToday(inputĐate)) {
        return inputĐate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (isYesterday(inputĐate)) {
        return ("Yesterday " + inputĐate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }));
    } else if (inputĐate.getFullYear() === now.getFullYear()) {
        return inputĐate.toLocaleDateString([], {
            day: '2-digit',
            month: 'short',
        });
    } else {
        return inputĐate.toLocaleDateString();
    }
}

export const formatMessageDateShort = (date) => {
    const now = new Date();
    const inputĐate = new Date(date);

    if (isToday(inputĐate)) {
        return inputĐate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (isYesterday(inputĐate)) {
        return "Yesterday ";
    } else if (inputĐate.getFullYear() === now.getFullYear()) {
        return inputĐate.toLocaleDateString([], {
            day: '2-digit',
            month: 'short',
        });
    } else {
        return inputĐate.toLocaleDateString();
    }
}

export const isToday = (date) => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

export const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    );
}
