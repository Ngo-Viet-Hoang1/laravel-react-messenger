import { ChatItem } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';

type Props = {
    selectedConversation?: ChatItem | null;
};

const ConversationHeader = ({ selectedConversation }: Props) => {
    return (
        <div className="flex items-center justify-between p-3 shadow-md">
            <div className="flex items-center gap-3">
                <Link
                    href={route('dashboard')}
                    className="inline-block sm:hidden"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>

                {selectedConversation?.is_user ? (
                    <UserAvatar user={selectedConversation} />
                ) : (
                    <GroupAvatar />
                )}

                <div className="">
                    <h3>{selectedConversation?.name}</h3>
                    {selectedConversation?.is_group && (
                        <span className="text-xs text-slate-500">
                            {selectedConversation?.users?.length} members
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationHeader;
