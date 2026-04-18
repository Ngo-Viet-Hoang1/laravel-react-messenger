import { UsersIcon } from '@heroicons/react/24/outline';

const GroupAvatar = () => {
    return (
        <div className="avatar placeholder">
            <div className="flex w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                <span className="text-xl">
                    <UsersIcon className="inline-block h-4 w-4" />
                </span>
            </div>
        </div>
    );
};

export default GroupAvatar;
