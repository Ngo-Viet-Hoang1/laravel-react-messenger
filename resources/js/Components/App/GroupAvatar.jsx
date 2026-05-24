import { UsersIcon } from '@heroicons/react/24/solid';

const GroupAvatar = () => {
    return (
        <>
            <div className="avatar placeholder">
                <div className="flex w-8 items-center justify-center rounded-full !bg-gray-400 text-gray-800">
                    <span className="text-xl">
                        <UsersIcon className="w-4" />
                    </span>
                </div>
            </div>
        </>
    );
};

export default GroupAvatar;
