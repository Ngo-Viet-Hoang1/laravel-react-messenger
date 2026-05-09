import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Link, router, usePage } from "@inertiajs/react";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";
import axios from "axios";
import GroupDescriptionPopover from "./GroupDescriptionPopver";
import GroupUsersPopover from "./GroupUserPopover";
import { useEventBus } from "@/EventBus";

const ConversationHeader = ({ selectedConversation }) => {
    const memberCount = selectedConversation?.is_group
        ? selectedConversation.users?.length ?? selectedConversation.user_ids?.length ?? 0
        : 0;
    
    const { emit } = useEventBus();
    const authUser = usePage().props.auth.user;
    
    const onDeleteGroup = () => { 
        if (!window.confirm("Are you sure you want to delete this group?")) { 
            return;
        }

        axios.delete(route("group.destroy", selectedConversation.id)).then(() => {
            emit("group.deleted", {
                id: selectedConversation.id,
                name: selectedConversation.name,
                source: "local",
            });
        }).catch((err) => {
            console.error(err);
            alert("Failed to delete group.");
        });
    }

    return (
        <>
            {selectedConversation && (
                <div className="p-3 flex items-center gap-3 border-b border-slate-700">
                    <div className="flex items-center gap-3">
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
                            <h3 className="text-sm font-semibold text-slate-200">{selectedConversation.name}</h3>
                            {selectedConversation.is_group && (
                                <p className="text-xs text-slate-400">
                                    {memberCount} members
                                </p>
                            )}
                        </div>
                    </div>
                    {selectedConversation.is_group && (
                        <div className="flex gap-3 ml-auto">
                            <GroupDescriptionPopover description={selectedConversation.description} />
                            <GroupUsersPopover users={selectedConversation.users} />
                            {selectedConversation.owner_id === authUser.id && (
                                <>
                                    <div className="tooltip tooltip-left" data-tip="Edit Group">
                                        <button className="text-gray-400 hover:text-gray-200"
                                            onClick={() => {
                                                emit("GroupModal.show", selectedConversation)
                                            }} >
                                            <PencilSquareIcon className="w-4" />
                                        </button>
                                    </div>
                                    <div className="tooltip tooltip-left" data-tip="Delete Group">
                                        <button className="text-gray-400 hover:text-gray-200"
                                            onClick={onDeleteGroup}>
                                            <TrashIcon className="w-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default ConversationHeader;