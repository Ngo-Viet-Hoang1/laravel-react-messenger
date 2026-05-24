import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useEventBus } from '@/EventBus';
import { useForm } from '@inertiajs/react';

export default function NewUserModal({ show = false, onClose = () => {} }) {
    const { emit } = useEventBus();
    const { data, setData, processing, reset, post, errors } = useForm({
        name: '',
        email: '',
        is_admin: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('user.store'), {
            onSuccess: () => {
                emit('toast', `User "${data.name}" was created.`);
                closeModal();
            },
        });
    };

    const closeModal = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={closeModal}>
            <form onSubmit={submit} className="overflow-y-auto p-6">
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    Create New User
                </h2>

                <div className="mt-8">
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <label className="flex items-center">
                        <Checkbox
                            name="is_admin"
                            checked={data.is_admin}
                            onChange={(e) =>
                                setData('is_admin', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                            Admin User
                        </span>
                    </label>
                    <InputError message={errors.is_admin} className="mt-2" />
                </div>

                <div className="mt-6 flex justify-end">
                    <SecondaryButton onClick={closeModal}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton className="ml-3" disabled={processing}>
                        Create
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
