import { User } from '@/types';

type AvatarUser = Pick<User, 'name' | 'avatar_url'>;

type Props = {
    user: AvatarUser;
    online?: boolean;
    profile?: boolean;
};

const UserAvatar = ({ user, online, profile = false }: Props) => {
    const onlineClass = online ? 'online' : '';
    const sizeClass = profile ? 'w-40' : 'w-8';
    const fallbackTextSizeClass = profile ? 'text-4xl' : 'text-sm';

    if (user.avatar_url) {
        return (
            <div className={`avatar ${onlineClass}`}>
                <div className={`${sizeClass} rounded-full`}>
                    <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`avatar placeholder ${onlineClass}`}>
            <div
                className={`!flex ${sizeClass} items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100`}
            >
                <span className={`${fallbackTextSizeClass} font-semibold`}>
                    {user.name.charAt(0).toUpperCase()}
                </span>
            </div>
        </div>
    );
};

export default UserAvatar;
