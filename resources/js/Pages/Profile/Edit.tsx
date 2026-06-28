import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const { auth } = usePage<PageProps>().props;

    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="w-full flex-1 overflow-y-auto bg-gray-50/50 py-12 dark:bg-gray-900/50">
                <div className="mx-auto max-w-2xl space-y-8 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50 sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-2xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50 sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-2xl" />
                    </div>

                    <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50 sm:rounded-lg sm:p-8">
                        <section className="max-w-2xl">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Premium
                            </h2>

                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {auth.user.is_premium
                                    ? `Premium is active until ${new Intl.DateTimeFormat().format(new Date(auth.user.premium_expires_at ?? ''))}.`
                                    : 'Free accounts keep messages for 90 days.'}
                            </p>

                            <Link
                                href={route('premium.index')}
                                className="mt-4 inline-flex items-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-white dark:focus:bg-white dark:focus:ring-offset-gray-800"
                            >
                                Manage premium
                            </Link>
                        </section>
                    </div>

                    <div className="bg-white p-4 shadow-sm ring-1 ring-red-900/10 dark:bg-red-900/10 dark:ring-red-500/20 sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-2xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
