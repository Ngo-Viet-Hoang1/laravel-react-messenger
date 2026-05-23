import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useEventBus } from '../../EventBus';
import InputError from '../InputError';
import InputLabel from '../InputLabel';
import Modal from '../Modal';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import TextInput from '../TextInput';
import UserPicker from './UserPicker';

export default function GroupModal({
    show = false,
    onClose = () => {},
    users = [],
}) {
    const page = usePage();
    const conversations = page.props.conversations;
    const authUser = page.props.auth.user;
    const { on, emit } = useEventBus();
    const [group, setGroup] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        description: '',
        user_ids: [],
    });

    const conversationUsers = Array.from(
        new Map(
            [
                ...conversations.filter((c) => c.is_user),
                ...(authUser ? [authUser] : []),
            ].map((user) => [Number(user.id), user]),
        ).values(),
    );

    const createOrUpdateGroup = (e) => {
        e.preventDefault();

        if (group?.id) {
            put(route('group.update', group.id), {
                onSuccess: () => {
                    closeModal();
                    emit('toast.show', `Group "${data.name}" was updated`);
                },
            });
            return;
        }
        post(route('group.store'), {
            onSuccess: () => {
                emit('toast.show', `Group "${data.name}" was created`);
                closeModal();
            },
        });
    };

    const closeModal = () => {
        reset();
        setGroup(null);
        onClose();
    };

    useEffect(() => {
        return on('GroupModal.show', (group) => {
            const groupUserIds = (group.users ?? []).map((user) =>
                Number(typeof user === 'object' ? user.id : user),
            );
            const mergedUserIds = new Set(groupUserIds);
            if (group.owner_id) {
                mergedUserIds.add(Number(group.owner_id));
            }
            if (authUser?.id) {
                mergedUserIds.add(Number(authUser.id));
            }

            setData({
                name: group.name,
                description: group.description || '',
                user_ids: Array.from(mergedUserIds),
            });
            setGroup(group);
        });
    }, [on]);

    return (
        <Modal show={show} onClose={closeModal}>
            <form
                onSubmit={createOrUpdateGroup}
                className="overflow-y-auto p-6"
            >
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {group?.id
                        ? `Edit Group "${group.name}"`
                        : 'Create new Group'}
                </h2>

                <div className="mt-6">
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        disabled={!!group?.id}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="description" value="Description" />

                    <TextInput
                        id="description"
                        rows={3}
                        className="mt-1 block w-full"
                        value={data.description || ''}
                        onChange={(e) => setData('description', e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.description} />
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <InputLabel value="Select Users" />
                        <span className="text-xs text-gray-500">
                            {data.user_ids.length} users selected
                        </span>
                    </div>

                    <UserPicker
                        value={
                            conversationUsers.filter((u) =>
                                data.user_ids.includes(u.id),
                            ) || []
                        }
                        options={conversationUsers}
                        onChange={(users) =>
                            setData(
                                'user_ids',
                                users.map((u) => u.id),
                            )
                        }
                    />

                    <InputError className="mt-2" message={errors.user_ids} />
                </div>

                <div className="mt-6 flex justify-end">
                    <SecondaryButton onClick={closeModal}>
                        Cancel
                    </SecondaryButton>

                    <PrimaryButton className="ms-3" disabled={processing}>
                        {group?.id ? 'Update' : 'Create'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
