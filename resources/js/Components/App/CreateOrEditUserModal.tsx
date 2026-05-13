import { useEventBus } from '@/EventBus';
import { User } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import Checkbox from '../Breeze/Checkbox';
import InputError from '../Breeze/InputError';
import InputLabel from '../Breeze/InputLabel';
import Modal from '../Breeze/Modal';
import PrimaryButton from '../Breeze/PrimaryButton';
import SecondaryButton from '../Breeze/SecondaryButton';
import TextInput from '../Breeze/TextInput';

type Props = {
    isOpen: boolean;
    user?: User | null;
    onClose: () => void;
};

type CreateOrEditUserFormData = {
    id: number | null;
    name: string;
    email: string;
    is_admin?: boolean;
};

const CreateOrEditUserModal = ({ isOpen, user, onClose }: Props) => {
    const { emit } = useEventBus();

    const { data, setData, processing, reset, post, patch, errors } =
        useForm<CreateOrEditUserFormData>({
            id: null,
            name: '',
            email: '',
            is_admin: false,
        });

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (user) {
            updateUser();
        } else {
            createUser();
        }
    };

    const createUser = () => {
        post(route('users.store'), {
            onSuccess: () => {
                emit('toast.show', `User "${data.name}" created successfully!`);
                handleClose();
            },
        });
    };

    const updateUser = () => {
        if (!user) return;

        patch(route('users.update', user.id), {
            onSuccess: () => {
                emit('toast.show', `User "${user.name}" updated successfully!`);
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

        if (user) {
            setData({
                id: user.id,
                name: user.name,
                email: user.email ?? '',
                is_admin: user.is_admin,
            });
        } else {
            reset();
        }
    }, [isOpen, user, reset, setData]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <form onSubmit={handleFormSubmit} className="p-6">
                <fieldset className="flex flex-col gap-2" disabled={processing}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {user ? `Edit User: ${user.name}` : 'Create User'}
                    </h2>

                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="User Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="User Email (for new users only)"
                        />
                        <TextInput
                            id="email"
                            name="email"
                            type="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <Checkbox
                            id="is_admin"
                            name="is_admin"
                            checked={data.is_admin}
                            onChange={(e) =>
                                setData('is_admin', e.target.checked)
                            }
                        />
                        <InputLabel htmlFor="is_admin" value="Is Admin" />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={handleClose}>
                            Cancel
                        </SecondaryButton>

                        <PrimaryButton type="submit" className="ml-3">
                            {user ? 'Update User' : 'Create User'}
                        </PrimaryButton>
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
};

export default CreateOrEditUserModal;
