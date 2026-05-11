import UserAvatar from '@/Components/App/UserAvatar';
import InputError from '@/Components/Breeze/InputError';
import InputLabel from '@/Components/Breeze/InputLabel';
import PrimaryButton from '@/Components/Breeze/PrimaryButton';
import TextInput from '@/Components/Breeze/TextInput';
import { Transition } from '@headlessui/react';
import { CameraIcon } from '@heroicons/react/24/outline';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

type FormData = {
    name: string;
    email: string;
    avatar: File | null;
    _method?: string;
};

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const fileInput = useRef<HTMLInputElement>(null);

    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm<FormData>({
            name: user.name,
            email: user.email,
            avatar: null,
            _method: 'PATCH',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('profile.update'), { forceFormData: true });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreview(URL.createObjectURL(file));
            setData('avatar', file);
        }
    };

    const handleRemovePreview = () => {
        setPreview(null);
        setData('avatar', null);
        if (fileInput.current) fileInput.current.value = '';
    };

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="flex flex-col items-center gap-2">
                    <div
                        className="group relative h-40 w-40 cursor-pointer overflow-hidden rounded-full"
                        onClick={() => fileInput.current?.click()}
                    >
                        <UserAvatar
                            user={{
                                ...user,
                                avatar_url: preview || user.avatar_url,
                            }}
                            profile
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <CameraIcon className="h-10 w-10 text-white" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-3">
                        <InputLabel htmlFor="avatar" value="Profile Picture" />

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="btn btn-outline btn-sm shadow-sm"
                                onClick={() => fileInput.current?.click()}
                            >
                                <CameraIcon className="mr-1.5 h-4 w-4" />
                                Change Avatar
                            </button>
                            {preview && (
                                <PrimaryButton
                                    type="button"
                                    className="bg-red-600 hover:bg-red-500"
                                    onClick={handleRemovePreview}
                                >
                                    Cancel
                                </PrimaryButton>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Recommended: Square image, max 2MB.
                        </p>

                        <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInput}
                            onChange={handleAvatarChange}
                        />

                        <InputError className="mt-2" message={errors.avatar} />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                        spellCheck={false}
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        spellCheck={false}
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
