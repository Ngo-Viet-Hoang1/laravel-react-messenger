import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="w-full flex-1 overflow-y-auto bg-gray-50/50 py-12 dark:bg-gray-900/50">
                <div className="mx-auto max-w-2xl space-y-8 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg sm:p-8 dark:bg-gray-800 dark:ring-gray-700/50">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-2xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg sm:p-8 dark:bg-gray-800 dark:ring-gray-700/50">
                        <UpdatePasswordForm className="max-w-2xl" />
                    </div>

                    <div className="bg-white p-4 shadow-sm ring-1 ring-red-900/10 sm:rounded-lg sm:p-8 dark:bg-red-900/10 dark:ring-red-500/20">
                        <DeleteUserForm className="max-w-2xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
