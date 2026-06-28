import { useEventBus } from '@/EventBus';
import { ChatItem, ChatMember } from '@/types';
import { ModalBaseProps } from '@/utils/createModalContext';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import InputError from '../Breeze/InputError';
import InputLabel from '../Breeze/InputLabel';
import Modal from '../Breeze/Modal';
import PrimaryButton from '../Breeze/PrimaryButton';
import SecondaryButton from '../Breeze/SecondaryButton';
import TextAreaInput from '../Breeze/TextAreaInput';
import TextInput from '../Breeze/TextInput';
import UserPicker from './UserPicker';

type Props = ModalBaseProps<ChatItem>;

type CreateOrEditGroupFormData = {
    id: number | null;
    name: string;
    description: string;
    user_ids: number[];
};

const CreateOrEditGroupModal = ({ isOpen, entity: group, onClose }: Props) => {
    const [availableUsers, setAvailableUsers] = useState<ChatMember[]>([]);

    const { emit } = useEventBus();

    const { data, setData, processing, reset, post, put, errors } =
        useForm<CreateOrEditGroupFormData>({
            id: null,
            name: '',
            description: '',
            user_ids: [],
        });

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (group) {
            updateGroup();
        } else {
            createGroup();
        }
    };

    const createGroup = () => {
        post(route('channels.store'), {
            onSuccess: () => {
                emit(
                    'toast.show',
                    `Group "${data.name}" created successfully!`,
                );
                handleClose();
            },
        });
    };

    const updateGroup = () => {
        if (!group) return;

        put(route('channels.update', group.id), {
            onSuccess: () => {
                emit(
                    'toast.show',
                    `Group "${group.name}" updated successfully!`,
                );
                handleClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;

        if (group) {
            setData({
                id: group.id,
                name: group.name ?? '',
                description: group.description ?? '',
                user_ids:
                    group.users
                        ?.filter((u) => group.owner_id !== u.id)
                        .map((u) => u.id) ?? [],
            });
        } else {
            reset();
        }
    }, [isOpen, group, reset, setData]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchUsers = async () => {
            const res = await axios.get<{ data: ChatMember[] }>(
                route('users.index'),
            );
            setAvailableUsers(
                res.data.data ?? (res.data as unknown as ChatMember[]),
            );
        };
        fetchUsers();
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={handleFormSubmit} className="p-6">
                <fieldset className="flex flex-col gap-2" disabled={processing}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {group ? `Edit Group: ${group.name}` : 'Create Group'}
                    </h2>

                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Group Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="description"
                            value="Group Description"
                        />
                        <TextAreaInput
                            id="description"
                            name="description"
                            value={data.description}
                            className="mt-1 block min-h-[120px] w-full"
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="mt-4">
                        <UserPicker
                            selectedUsers={
                                availableUsers?.filter(
                                    (u) =>
                                        group?.owner_id !== u.id &&
                                        data.user_ids.includes(u.id),
                                ) || []
                            }
                            users={availableUsers || []}
                            onUsersChange={(selectedUsers: ChatMember[]) =>
                                setData(
                                    'user_ids',
                                    selectedUsers.map((u) => u.id),
                                )
                            }
                        />
                        <InputError message={errors.user_ids} />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={handleClose}>
                            Cancel
                        </SecondaryButton>

                        <PrimaryButton type="submit" className="ml-3">
                            {group ? 'Update Group' : 'Create Group'}
                        </PrimaryButton>
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
};

export default CreateOrEditGroupModal;
