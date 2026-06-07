import { User } from '@/types';
import UserOptionsDropdown from './UserOptionsDropdown';
import UserAvatar from './UserAvatar';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ConfigProvider, Table, theme as antdTheme } from 'antd';
import type { TableColumnsType } from 'antd';

type Props = {
    users: User[];
    isOnline: (userId: number | null | undefined) => boolean;
    selectedIds: Set<number>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;
};

const RoleBadge = ({ isAdmin }: { isAdmin: boolean }) => {
    const badgeClass = isAdmin
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {isAdmin ? 'Admin' : 'User'}
        </span>
    );
};

const StatusBadge = ({
    blockedAt,
    online,
}: {
    blockedAt?: string | null;
    online: boolean;
}) => {
    const config = blockedAt
        ? {
              bg: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
              dot: 'bg-red-500',
              text: 'Blocked',
          }
        : online
          ? {
                bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                dot: 'bg-emerald-500 animate-pulse',
                text: 'Online',
            }
          : {
                bg: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                dot: 'bg-slate-400',
                text: 'Offline',
            };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {config.text}
        </span>
    );
};

const UserManagementTable = ({ users, isOnline, selectedIds, setSelectedIds }: Props) => {
    const { theme } = useTheme();

    const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                <p className="text-lg font-medium">No users found</p>
                <p className="mt-1 text-sm">
                    Try adjusting your search or filters.
                </p>
            </div>
        );
    }

    const columns: TableColumnsType<User> = [
        {
            title: 'Name',
            key: 'name',
            render: (_, user) => (
                <div className="flex items-center gap-3">
                    <UserAvatar
                        user={user}
                        online={isOnline(user.id)}
                    />
                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                            {user.name}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <span className="text-slate-600 dark:text-slate-300">
                    {email}
                </span>
            ),
        },
        {
            title: 'Role',
            key: 'role',
            render: (_, user) => <RoleBadge isAdmin={user.is_admin} />,
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, user) => (
                <StatusBadge
                    blockedAt={user.blocked_at}
                    online={isOnline(user.id)}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, user) => (
                <UserOptionsDropdown user={user} mode="table" />
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys: Array.from(selectedIds),
        onChange: (selectedRowKeys: React.Key[]) => {
            setSelectedIds(new Set(selectedRowKeys as number[]));
        },
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark
                    ? antdTheme.darkAlgorithm
                    : antdTheme.defaultAlgorithm,
                token: {
                    colorBgContainer: 'transparent',
                },
                components: {
                    Table: {
                        headerBg: 'transparent',
                        headerColor: isDark ? '#94a3b8' : '#64748b',
                        headerSplitColor: 'transparent',
                        rowHoverBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                        rowSelectedBg: isDark ? 'rgba(99, 102, 241, 0.12)' : '#f1f5f9',
                        rowSelectedHoverBg: isDark ? 'rgba(99, 102, 241, 0.2)' : '#e2e8f0',
                        borderColor: isDark ? '#334155' : '#f1f5f9',
                    },
                },
            }}
        >
            <div className="w-full">
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    pagination={false}
                    className="border-none"
                />
            </div>
        </ConfigProvider>
    );
};

export default UserManagementTable;
