import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Link } from "@inertiajs/react";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";

const ConversationHeader = ({ selectedConversation }) => { 
  return (
    <>
      {selectedConversation && (
        <div className="p-3 flex justify-between items-center  border-b border-slate-700">
          <Link href={route('dashboard')} className="inline-block sm::hidden">
            <ArrowLeftIcon className="w-6" />
          </Link>
          {selectedConversation.is_user && (
            <UserAvatar user={selectedConversation} />
          )}
          {selectedConversation.is_group && (
            <GroupAvatar group={selectedConversation} />
          )}
          <div>
            <h3>{selectedConversation.name}</h3>
            {selectedConversation.is_group && (
              <p className="text-xs text-gray-500">
                {selectedConversation.members.length} members
              </p>
            )}
          </div>

        </div>
      )}
    </>
  )
}

export default ConversationHeader;