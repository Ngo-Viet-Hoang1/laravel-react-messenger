import MessageAttachments from '@/Components/App/MessageAttachments';
import UserAvatar from '@/Components/App/UserAvatar';
import InputError from '@/Components/Breeze/InputError';
import { REASON_LABELS, STATUS_BADGE } from '@/constants/reports';
import { MessageReport } from '@/types/report';
import { formatDateTime } from '@/utils/chatTime.util';
import {
    CheckCircleIcon,
    NoSymbolIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

type ReportCardProps = {
    report: MessageReport;
    onReview: (reportId: number, status: 'reviewed' | 'dismissed') => void;
    onBlockUser: (userId: number) => void;
};

export default function ReportCard({
    report,
    onReview,
    onBlockUser,
}: ReportCardProps) {
    const badge = STATUS_BADGE[report.status];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4">
                {/* Left: Report Info */}
                <div className="min-w-0 flex-1 space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                            {badge.label}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            Total Reports: {report.reports_count ?? 1}
                        </span>
                    </div>

                    {/* Reported Message */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="mb-2 flex items-center gap-2">
                            <UserAvatar user={report.message.sender} />
                            <div className="min-w-0">
                                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {report.message.sender.name}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                    Message sent on{' '}
                                    {formatDateTime(report.message.created_at)}
                                </span>
                            </div>
                        </div>
                        {report.message.content && (
                            <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">
                                {report.message.content}
                            </p>
                        )}
                        {report.message.attachments &&
                            report.message.attachments.length > 0 && (
                                <div className="mt-2">
                                    <MessageAttachments
                                        attachments={report.message.attachments}
                                    />
                                </div>
                            )}
                        {!report.message.content &&
                            (!report.message.attachments ||
                                report.message.attachments.length === 0) && (
                                <InputError
                                    message="[empty message]"
                                    className="italic !text-slate-700 text-slate-700 opacity-60 dark:!text-slate-300 dark:text-slate-300"
                                />
                            )}
                    </div>

                    {/* Sibling Reports (List of individual report details) */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Reporters & Reasons
                        </h4>
                        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 dark:divide-slate-700/50 dark:border-slate-800 dark:bg-slate-900/10">
                            {(report.sibling_reports ?? [report]).map((sib) => (
                                <div key={sib.id} className="p-3 text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <UserAvatar user={sib.reporter} />
                                            <div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {sib.reporter.name}
                                                </span>
                                                <span className="mx-2 text-slate-300 dark:text-slate-600">
                                                    •
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    {formatDateTime(
                                                        sib.created_at,
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                            {REASON_LABELS[sib.reason] ??
                                                sib.reason}
                                        </span>
                                    </div>
                                    {sib.note && (
                                        <p className="mt-1.5 pl-10 text-xs italic text-slate-500 dark:text-slate-400">
                                            "{sib.note}"
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Actions / Reviewer info */}
                <div className="flex w-36 shrink-0 flex-col gap-2">
                    {report.status === 'pending' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onReview(report.id, 'reviewed')}
                                title="Mark all as Reviewed"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                            >
                                <CheckCircleIcon className="h-4 w-4" />
                                Reviewed
                            </button>
                            <button
                                type="button"
                                onClick={() => onReview(report.id, 'dismissed')}
                                title="Dismiss all Reports"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                            >
                                <XCircleIcon className="h-4 w-4" />
                                Dismiss
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    onBlockUser(report.message.sender_id)
                                }
                                title="Block this user"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                            >
                                <NoSymbolIcon className="h-4 w-4" />
                                Block User
                            </button>
                        </>
                    ) : (
                        report.reviewer &&
                        report.reviewed_at && (
                            <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800/50 dark:bg-slate-900/40">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Processed By
                                </span>
                                <span
                                    className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-300"
                                    title={report.reviewer.name}
                                >
                                    {report.reviewer.name}
                                </span>
                                <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                                    {formatDateTime(report.reviewed_at, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
