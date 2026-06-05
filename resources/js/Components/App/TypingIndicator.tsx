import UserAvatar from '@/Components/App/UserAvatar';
import { TypingUser, useTypingIndicator } from '@/hooks/useTypingIndicator';

type Props = {
    channelName: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string | null;
    className?: string;
};

const Dot = ({ delay }: { delay: string }) => (
    <span
        className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-slate-300/80 dark:bg-slate-200/80"
        style={{ animationDelay: delay }}
    />
);

const TypingAvatarStack = ({ users }: { users: Map<string, TypingUser> }) => {
    if (users.size === 0) return null;

    return (
        <div className="flex items-center">
            {Array.from(users.values())
                .slice(0, 3)
                .map((user, index) => (
                    <div key={user.id} className={index === 0 ? '' : '-ml-2.5'}>
                        <UserAvatar
                            user={{
                                name: user.name,
                                avatar_url: user.avatarUrl || undefined,
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
        { id: userId, name: userName, avatarUrl: userAvatarUrl ?? '' },
        {},
        channelName,
    );

    if (typingUsers.size === 0) return null;

    const users = Array.from(typingUsers.values());
    const label =
        users.length === 1
            ? `${users[0].name || 'Someone'} is typing`
            : `${users.length} people are typing`;

    return (
        <div role="status" aria-live="polite" className={className}>
            <div className="flex items-end gap-2">
                <TypingAvatarStack users={typingUsers} />

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
