import { UsersIcon } from '@heroicons/react/24/solid';

const GroupAvatar = ({}) => {
    return (
        <>
            <div className="avatar placeholder shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-gray-800">
                    <span className="flex items-center justify-center leading-none">
                        <UsersIcon className="w-4" />
                    </span>
                </div>
            </div>
        </>
    );
};

export default GroupAvatar;
