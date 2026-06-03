import useTypingIndicator from '@/hooks/useTypingIndicator';
import UserAvatar from '@/Components/App/UserAvatar';

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

const TypingAvatarStack = ({ users }: { users: TypingUser[] }) => {
    if (users.length === 0) return null;

    return (
        <div className="flex items-center">
            {users.slice(0, 3).map((user, index) => (
                <div
                    key={user.id}
                    className={index === 0 ? '' : '-ml-2.5'}
                >
                    <UserAvatar
                        user={{
                            name: user.name ?? null,
                            avatar_url: user.avatarUrl,
                        }}
                    />
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

    if (typingUsers.size === 0) return null;

    const typingUsersArray = Array.from(typingUsers.values());
    const label =
        typingUsersArray.length === 1
            ? `${typingUsersArray[0].name || 'Đang nhập'} đang nhập`
            : `${typingUsersArray.length} người đang nhập`;

    return (
        <div role="status" aria-live="polite" className={className}>
            <div className="flex items-end gap-2">
                <TypingAvatarStack users={typingUsersArray} />

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
