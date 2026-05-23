import { TrashIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEventBus } from '../../EventBus';
import GroupAvatar from './GroupAvatar';
import GroupDescriptionPopover from './GroupDescriptionPopover';
import GroupUsersPopover from './GroupUsersPopover';
import UserAvatar from './UserAvatar';

const ConversationHeader = ({ selectedConversation }) => {
    const authUser = usePage().props.auth.user;
    const { emit } = useEventBus();
    const uniqueMemberCount = selectedConversation?.is_group
        ? new Set(
              (selectedConversation.users ?? []).map((user) =>
                  Number(user?.id ?? user),
              ),
          ).size
        : 0;

    const onDeleteGroup = () => {
        if (!window.confirm('Are you sure you want to delete this group?')) {
            return;
        }

        axios
            .delete(route('group.destroy', selectedConversation.id))
            .then((res) => {
                const message =
                    res?.data?.message || 'Group deletion has been scheduled.';
                emit('toast', message);
                console.log(res);
            })
            .catch((err) => {
                console.error(err);
            });
    };

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
                                    {uniqueMemberCount} members
                                </p>
                            )}
                        </div>
                    </div>
                    {selectedConversation.is_group && (
                        <div className="flex gap-3">
                            <GroupDescriptionPopover
                                group={selectedConversation}
                            />
                            <GroupUsersPopover
                                group={selectedConversation}
                                currentUser={authUser}
                            />
                            {selectedConversation.owner_id === authUser.id && (
                                <>
                                    <div
                                        className="tooltip tooltip-left"
                                        data-tip="Edit Group"
                                    >
                                        <button
                                            onClick={(ev) =>
                                                emit(
                                                    'GroupModal.show',
                                                    selectedConversation,
                                                )
                                            }
                                            className="rounded-full p-2 text-gray-400 hover:text-gray-200"
                                        >
                                            <PencilSquareIcon className="w-6" />
                                        </button>
                                    </div>
                                    <div
                                        className="tooltip tooltip-left"
                                        data-tip="Delete Group"
                                    >
                                        <button
                                            onClick={onDeleteGroup}
                                            className="rounded-full p-2 text-gray-400 hover:text-gray-200"
                                        >
                                            <TrashIcon className="w-6" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ConversationHeader;
