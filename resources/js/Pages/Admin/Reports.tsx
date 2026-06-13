import ReportCard from '@/Components/App/ReportCard';
import { STATUS_TABS } from '@/constants/reports';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { LengthAwarePaginatedResponse } from '@/types/pagination';
import { MessageReport } from '@/types/report';
import { FlagIcon } from '@heroicons/react/24/outline';
import { InfiniteScroll, router, usePage } from '@inertiajs/react';
import { useCallback, type ReactNode } from 'react';

type ReportsPageProps = {
    reports: LengthAwarePaginatedResponse<MessageReport>;
};

const Reports = ({ reports }: ReportsPageProps) => {
    const url = new URL(usePage().url, window.location.origin);
    const currentStatus = url.searchParams.get('status') ?? '';

    const handleFilterStatus = useCallback((status: string): void => {
        router.get(route('admin.reports.index'), status ? { status } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    const handleReview = useCallback(
        (reportId: number, status: 'reviewed' | 'dismissed'): void => {
            router.patch(
                route('admin.reports.review', reportId),
                { status },
                { preserveScroll: true },
            );
        },
        [],
    );

    const handleBlockUser = useCallback((userId: number): void => {
        router.patch(
            route('users.block', userId),
            {},
            { preserveScroll: true },
        );
    }, []);

    return (
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex shrink-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <FlagIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Message Reports
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Review and manage reported messages
                    </p>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="mb-6 flex shrink-0 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleFilterStatus(tab.value)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            currentStatus === tab.value
                                ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Reports List */}
            {reports.data.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 dark:border-slate-700">
                    <FlagIcon className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium text-slate-400 dark:text-slate-500">
                        No reports found
                    </p>
                </div>
            ) : (
                <InfiniteScroll
                    data="reports"
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4 pr-1"
                >
                    {reports.data.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onReview={handleReview}
                            onBlockUser={handleBlockUser}
                        />
                    ))}
                </InfiniteScroll>
            )}
        </div>
    );
};

Reports.layout = (page: ReactNode) => (
    <AuthenticatedLayout>{page}</AuthenticatedLayout>
);

export default Reports;
