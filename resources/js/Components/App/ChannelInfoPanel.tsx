import { useChannelModal } from '@/Contexts/ChannelModalContext';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { ChatItem, ChatMember, MessageAttachment } from '@/types';
import {
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    UserPlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import AddMemberModal from './AddMemberModal';
import GroupAvatar from './GroupAvatar';
import SharedMediaAndFiles from './SharedMediaAndFiles';
import UserAvatar from './UserAvatar';

type Props = {
    channel: ChatItem;
    currentUserId: number;
    onClose: () => void;
    onSearchClick: () => void;
    onDeleteClick: () => void;
    onMembersChange: (updatedUsers: ChatMember[]) => void;
    onAttachmentClick?: (
        attachments: MessageAttachment[],
        index: number,
    ) => void;
};

const ChannelInfoPanel = ({
    channel,
    currentUserId,
    onClose,
    onSearchClick,
    onDeleteClick,
    onMembersChange,
    onAttachmentClick,
}: Props) => {
    const { openModal } = useChannelModal();
    const confirmDialog = useConfirm();
    const [showAddMember, setShowAddMember] = useState(false);
    const isGroup = channel.type === 'group';
    const canManageMembers =
        isGroup &&
        (channel.owner_id === currentUserId ||
            channel.users?.find((u) => u.id === currentUserId)?.is_admin);

    const handleRemoveMember = useCallback(
        async (member: ChatMember): Promise<void> => {
            const confirmed = await confirmDialog({
                title: 'Remove Member',
                message: `Remove "${member.name}" from this group?`,
                isDanger: true,
                confirmText: 'Remove',
            });

            if (!confirmed) return;

            await axios.delete(
                route('channels.members.remove', [channel.id, member.id]),
            );

            onMembersChange(
                (channel.users ?? []).filter((u) => u.id !== member.id),
            );
        },
        [confirmDialog, channel.id, channel.users, onMembersChange],
    );

    return (
        <>
            <div className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        Details
                    </h3>
                    <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        onClick={onClose}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="shrink-0 [&_.avatar_div]:h-20! [&_.avatar_div]:w-20! [&_.avatar_span]:text-3xl! [&_.avatar_svg]:h-10! [&_.avatar_svg]:w-10!">
                            {isGroup ? (
                                <GroupAvatar />
                            ) : (
                                <UserAvatar user={channel} />
                            )}
                        </div>

                        <h4 className="mt-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                            {channel.name}
                        </h4>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6 border-b border-slate-100 pb-5 dark:border-slate-700/50">
                        <button
                            type="button"
                            onClick={onSearchClick}
                            className="group flex flex-col items-center gap-1 focus:outline-none"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:group-hover:bg-slate-600">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
                                Search
                            </span>
                        </button>

                        {isGroup && (
                            <button
                                type="button"
                                onClick={() => openModal(channel)}
                                className="group flex flex-col items-center gap-1 focus:outline-none"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:group-hover:bg-slate-600">
                                    <PencilIcon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
                                    Edit
                                </span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onDeleteClick}
                            className="group flex flex-col items-center gap-1 focus:outline-none"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors group-hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:group-hover:bg-red-900/30">
                                <TrashIcon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300">
                                Delete
                            </span>
                        </button>
                    </div>

                    <div className="mt-4 flex flex-col">
                        {isGroup && channel.users && (
                            <div className="collapse-arrow collapse rounded-none border-b border-slate-100 bg-transparent dark:border-slate-700/50">
                                <input type="checkbox" className="peer" />
                                <div className="collapse-title min-h-0 px-0 py-3 text-sm font-semibold text-slate-700 peer-checked:pb-1 dark:text-slate-300">
                                    Members ({channel.users.length})
                                </div>
                                <div className="collapse-content px-0 pt-1 pb-3">
                                    <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
                                        {channel.users.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between rounded-lg px-1 py-1"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <UserAvatar user={member} />
                                                    <span className="max-w-[130px] truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                                                        {member.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {member.id ===
                                                        channel.owner_id && (
                                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                                            Owner
                                                        </span>
                                                    )}
                                                    {canManageMembers &&
                                                        member.id !==
                                                            channel.owner_id && (
                                                            <button
                                                                type="button"
                                                                title="Remove member"
                                                                onClick={() =>
                                                                    handleRemoveMember(
                                                                        member,
                                                                    )
                                                                }
                                                                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                                            >
                                                                <TrashIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {canManageMembers && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAddMember(true)
                                            }
                                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-300"
                                        >
                                            <UserPlusIcon className="h-3.5 w-3.5" />
                                            Add Member
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="collapse-arrow collapse rounded-none border-b border-slate-100 bg-transparent dark:border-slate-700/50">
                            <input type="checkbox" className="peer" />
                            <div className="collapse-title min-h-0 px-0 py-3 text-sm font-semibold text-slate-700 peer-checked:pb-1 dark:text-slate-300">
                                Media & Files
                            </div>
                            <div className="collapse-content px-0 pt-1 pb-3 text-xs text-slate-500 dark:text-slate-400">
                                <SharedMediaAndFiles
                                    channelId={channel.id}
                                    onAttachmentClick={onAttachmentClick}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAddMember && (
                <AddMemberModal
                    isOpen={showAddMember}
                    channel={channel}
                    onClose={() => setShowAddMember(false)}
                    onMemberAdded={(newMember) => {
                        setShowAddMember(false);
                        onMembersChange([...(channel.users ?? []), newMember]);
                    }}
                />
            )}
        </>
    );
};

export default React.memo(ChannelInfoPanel);
