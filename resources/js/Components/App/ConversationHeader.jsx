import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Link } from '@inertiajs/react';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';

const ConversationHeader = ({ selectedConversation }) => {
    return (
        <>
            {selectedConversation && (
                <div className="flex items-center justify-between border-b border-slate-700 p-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('dashboard')}
                            className="inline-block sm:hidden"
                        >
                            <ArrowLeftIcon className="w-6" />
                        </Link>
                        {selectedConversation.is_user && (
                            <UserAvatar user={selectedConversation} />
                        )}
                        {selectedConversation.is_group && <GroupAvatar />}
                        <div className="flex flex-col justify-center leading-tight">
                            <h3 className="text-sm font-medium">
                                {selectedConversation.name}
                            </h3>
                            {selectedConversation.is_group && (
                                <p className="text-xs text-gray-500">
                                    {selectedConversation.users?.length ?? 0}{' '}
                                    members
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConversationHeader;
