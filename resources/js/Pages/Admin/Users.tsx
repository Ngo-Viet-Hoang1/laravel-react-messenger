import BulkActionsBar from '@/Components/App/BulkActionsBar';
import TablePagination from '@/Components/App/TablePagination';
import UserFiltersBar from '@/Components/App/UserFiltersBar';
import UserManagementTable from '@/Components/App/UserManagementTable';
import { useUserModal } from '@/Contexts/UserModalContext';
import useAdminUsers, { AdminUserFilters } from '@/hooks/useAdminUsers';
import useOnlinePresence from '@/hooks/useOnlinePresence';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { LengthAwarePaginatedResponse, User } from '@/types';
import { Head } from '@inertiajs/react';

export type AdminUsersPageProps = {
    users: LengthAwarePaginatedResponse<User>;
    filters: AdminUserFilters;
};

function AdminUsers({
    users: initialUsers,
    filters: initialFilters,
}: AdminUsersPageProps) {
    const { isOnline } = useOnlinePresence();
    const { openModal } = useUserModal();
    const {
        users,
        filters,
        search,
        selectedIds,
        setSelectedIds,
        setSearch,
        handleSearchClick,
        handleRoleChange,
        handleStatusChange,
        handlePageChange,
        handleBulkBlock,
        handleBulkUnblock,
        handleBulkDelete,
    } = useAdminUsers(initialUsers, initialFilters);

    return (
        <>
            <Head title="User Management" />

            <div className="min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-white xs:m-2 xs:shadow-sm dark:bg-slate-800">
                <div className="flex h-full flex-col overflow-hidden">
                    <UserFiltersBar
                        search={search}
                        onSearchChange={setSearch}
                        onSearchClick={handleSearchClick}
                        roleValue={filters.role}
                        onRoleChange={handleRoleChange}
                        statusValue={filters.status}
                        onStatusChange={handleStatusChange}
                        onNewUser={() => openModal()}
                    />

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <UserManagementTable
                            users={users.data}
                            isOnline={isOnline}
                            selectedIds={selectedIds}
                            setSelectedIds={setSelectedIds}
                        />
                    </div>

                    <TablePagination
                        meta={users.meta}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>

            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClear={() => setSelectedIds(new Set())}
                    onBlock={handleBulkBlock}
                    onUnblock={handleBulkUnblock}
                    onDelete={handleBulkDelete}
                />
            )}
        </>
    );
}

AdminUsers.layout = (page: React.ReactNode) => (
    <AuthenticatedLayout>{page}</AuthenticatedLayout>
);

export default AdminUsers;
