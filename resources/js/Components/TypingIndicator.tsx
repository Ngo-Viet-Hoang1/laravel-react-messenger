import useTypingIndicator from '@/hooks/useTypingIndicator';
import { type ChatMember } from '@/types';

type TypingUser = {
    id: string;
    name?: string;
    avatarUrl?: string | null;
};

type Props = {
    channelName: string;
    userId: string;
    userName?: string;
    userAvatarUrl?: string | null;
    className?: string;
};

const Dot = ({ delay }: { delay: string }) => (
    <span
        className="h-1.5 w-1.5 rounded-full bg-slate-300/80 animate-typing-dot dark:bg-slate-200/80"
        style={{ animationDelay: delay }}
    />
);

const TypingAvatar = ({ user }: { user: TypingUser }) => {
    const initial = (user.name?.charAt(0) ?? '?').toUpperCase();

    return user.avatarUrl ? (
        <img
            src={user.avatarUrl}
            alt={user.name ?? 'User'}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-900/60 shadow-sm dark:ring-white/10"
        />
    ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 ring-2 ring-slate-900/60 shadow-sm dark:bg-slate-700 dark:text-slate-100 dark:ring-white/10">
            {initial}
        </div>
    );
};

const TypingAvatarStack = ({ users }: { users: TypingUser[] }) => {
    if (users.length === 0) return null;

    return (
        <div className="flex items-center">
            {users.slice(0, 3).map((user, index) => (
                <div
                    key={user.id}
                    className={index === 0 ? '' : '-ml-2.5'}
                >
                    <TypingAvatar user={user} />
                </div>
            ))}
        </div>
    );
};

export default function TypingIndicator({
    channelName,
    userId,
    userName,
    userAvatarUrl,
    className,
}: Props) {
    const { typingUsers } = useTypingIndicator(
        {
            channelName,
            userId,
            userName,
            userAvatarUrl,
        },
        {
            debounceMs: 800,
            expireMs: 2500,
            channelType: 'private',
        },
    );

    if (typingUsers.length === 0) return null;

    const label =
        typingUsers.length === 1
            ? `${typingUsers[0].name || 'Đang nhập'} đang nhập`
            : `${typingUsers.length} người đang nhập`;

    return (
        <div role="status" aria-live="polite" className={className}>
            <div className="flex items-end gap-2">
                <TypingAvatarStack users={typingUsers as TypingUser[]} />

                <div className="inline-flex items-center rounded-2xl bg-slate-600 px-3 py-2 shadow-sm dark:bg-slate-700">
                    <div className="flex items-center gap-1.5 px-0.5">
                        <Dot delay="0s" />
                        <Dot delay="0.12s" />
                        <Dot delay="0.24s" />
                    </div>
                </div>
            </div>

            <span className="sr-only">{label}</span>
        </div>
    );
}
