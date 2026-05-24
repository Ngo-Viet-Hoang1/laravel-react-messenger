const UserAvatar = ({ user, online = null, profile = false }) => {
    if (!user) {
        return null;
    }

    let onlineClass =
        online === true ? 'online' : online === false ? 'offline' : '';

    const sizeClass = profile ? 'w-40' : 'w-8';
    const avatarClass = `avatar shrink-0 ${onlineClass}`;
    const placeholderClass = `avatar placeholder shrink-0 ${onlineClass}`;

    return (
        <>
            {user.avatar_url && (
                <div className={avatarClass}>
                    <div
                        className={`overflow-hidden rounded-full ${sizeClass}`}
                    >
                        <img src={user.avatar_url} />
                    </div>
                </div>
            )}
            {!user.avatar_url && (
                <div className={placeholderClass}>
                    <div
                        className={`flex items-center justify-center rounded-full bg-gray-400 text-gray-800 ${sizeClass}`}
                    >
                        <span className={profile ? 'text-5xl' : 'text-xs'}>
                            {user.name.substring(0, 1)}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserAvatar;
