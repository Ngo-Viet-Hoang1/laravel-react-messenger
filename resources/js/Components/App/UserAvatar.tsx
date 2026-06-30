import { User } from '@/types';

type AvatarUser = Pick<User, 'avatar_url'> & {
    name: string | null;
};

type Props = {
    user: AvatarUser;
    online?: boolean;
    profile?: boolean;
};

const UserAvatar = ({ user, online, profile = false }: Props) => {
    const onlineClass = online ? 'avatar-online' : '';
    const sizeClass = profile ? 'h-40 w-40' : 'h-8 w-8';
    const fallbackTextSizeClass = profile ? 'text-4xl' : 'text-sm';
    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

    if (user.avatar_url) {
        return (
            <div className={`avatar ${onlineClass}`}>
                <div className={`${sizeClass} rounded-full`}>
                    <img
                        src={user.avatar_url}
                        alt={user.name ?? 'User'}
                        className="h-full w-full rounded-full object-cover"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`avatar avatar-placeholder ${onlineClass}`}>
            <div
                className={`flex! ${sizeClass} items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100`}
            >
                <span className={`${fallbackTextSizeClass} font-semibold`}>
                    {initial}
                </span>
            </div>
        </div>
    );
};

export default UserAvatar;
