import { ChatMessage } from '@/types';
import { formatChatTime } from '@/utils/chatTime.util';
import React from 'react';
import UserAvatar from './UserAvatar';

type Props = {
    message: ChatMessage;
    searchQuery: string;
    onClick: (messageId: number) => void;
};

/**
 * Highlights occurrences of `query` within `text` by wrapping matches
 * in a styled <mark> element.
 */
const HighlightedText = ({ text, query }: { text: string; query: string }) => {
    if (!query.trim()) return <>{text}</>;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span
                        key={i}
                        className="font-bold text-slate-900 dark:text-slate-100"
                    >
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </>
    );
};

const DELETED_USER = { name: 'Deleted User', avatar_url: null };

const SearchResultItem = ({ message, searchQuery, onClick }: Props) => {
    const sender = message.sender ?? DELETED_USER;
    const time = formatChatTime(message.created_at);

    /** Truncate content to ~120 chars centered around the first match. */
    const snippet = React.useMemo((): string => {
        const content = message.content ?? '';
        if (content.length <= 120) return content;

        const lowerContent = content.toLowerCase();
        const matchIndex = lowerContent.indexOf(searchQuery.toLowerCase());

        if (matchIndex === -1) return content.slice(0, 120) + '…';

        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(
            content.length,
            matchIndex + searchQuery.length + 80,
        );
        const prefix = start > 0 ? '…' : '';
        const suffix = end < content.length ? '…' : '';

        return prefix + content.slice(start, end) + suffix;
    }, [message.content, searchQuery]);

    return (
        <button
            type="button"
            className="group/result flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60"
            onClick={() => onClick(message.id)}
        >
            <div className="mt-0.5 shrink-0">
                <UserAvatar user={sender} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {sender.name}
                    </span>
                </div>

                <div className="mt-0.5 flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <span className="min-w-0 truncate">
                        <HighlightedText text={snippet} query={searchQuery} />
                    </span>
                    {time && (
                        <span className="flex shrink-0 items-center text-xs text-slate-400 dark:text-slate-500">
                            <span className="mx-1 text-slate-300 dark:text-slate-600">
                                ·
                            </span>
                            <time dateTime={time.dateTime} title={time.tooltip}>
                                {time.label}
                            </time>
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

export default React.memo(SearchResultItem);
