import { useConfirm } from '@/Contexts/ConfirmContext';
import { useGroupModal } from '@/Contexts/GroupModalContext';
import { useEventBus } from '@/EventBus';
import { ChatItem, PageProps } from '@/types';
import {
    ArrowLeftIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import GroupAvatar from './GroupAvatar';
import GroupDescriptionPopover from './GroupDescriptionPopover';
import GroupUsersPopover from './GroupUsersPopover';
import UserAvatar from './UserAvatar';

type Props = {
    conversation?: ChatItem | null;
};

const ConversationHeader = ({ conversation }: Props) => {
    const page = usePage<PageProps>();
    const currentUser = page.props.auth.user;
    const isGroupOwner =
        conversation?.is_group && conversation?.owner_id === currentUser.id;

    const { emit } = useEventBus();
    const { openModal } = useGroupModal();
    const confirmDialog = useConfirm();

    const onDeleteGroup = async () => {
        const isConfirmed = await confirmDialog({
            title: 'Delete Group',
            message:
                'Are you sure you want to delete this group? This action cannot be undone.',
            isDanger: true,
            confirmText: 'Yes, delete',
        });

        if (!isConfirmed) return;

        try {
            const { data } = await axios.delete(
                route('groups.destroy', conversation?.id),
            );
            emit(
                'toast.show',
                data.message ||
                    `The group "${conversation?.name}" has been deleted`,
            );
        } catch (error) {
            emit(
                'toast.show',
                `Failed to delete group "${conversation?.name}". Please try again.`,
            );
        }
    };

    return (
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex min-w-0 items-center gap-3">
                <Link
                    href={route('dashboard')}
                    className="inline-block rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 sm:hidden"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>

                <div className="shrink-0">
                    {conversation?.is_user ? (
                        <UserAvatar user={conversation} />
                    ) : (
                        <GroupAvatar />
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">
                        {conversation?.name}
                    </h3>

                    {conversation?.is_group && (
                        <div className="flex items-center gap-2">
                            <GroupUsersPopover users={conversation?.users} />

                            {conversation?.description && (
                                <GroupDescriptionPopover
                                    description={conversation?.description}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isGroupOwner && (
                <div className="ml-4 flex shrink-0 items-center gap-1">
                    <div data-tip="Edit Group" className="tooltip tooltip-left">
                        <button
                            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                            onClick={() => {
                                openModal(conversation);
                            }}
                        >
                            <PencilIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div
                        data-tip="Delete Group"
                        className="tooltip tooltip-left"
                    >
                        <button
                            className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            onClick={onDeleteGroup}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversationHeader;
