const UserAvatar = ({ user, online = null, profile = false }) => {
    let onlineClass =
        online === true ? 'online' : online === false ? 'offline' : '';

    const sizeClass = profile ? 'w-40' : 'w-8';

    return (
        <>
            {user.avatar_url && (
                <div className={`avatar ${onlineClass}`}>
                    <div className={`rounded-full ${sizeClass}`}>
                        <img src={user.avatar_url} alt={user.name} />
                    </div>
                </div>
            )}
            {!user.avatar_url && (
                <div className={`avatar placeholder ${onlineClass}`}>
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-gray-800`}
                    >
                        <span className="text-sm font-semibold">
                            {(user.name || '?').substring(0, 1)}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserAvatar;
