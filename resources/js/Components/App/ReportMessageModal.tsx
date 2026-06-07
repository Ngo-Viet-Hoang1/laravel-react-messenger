import { REASON_OPTIONS } from '@/constants/reports';
import { type ReportReason } from '@/types/report';
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { FlagIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { Fragment, type FormEvent } from 'react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    messageId: number;
};

const ReportMessageModal = ({ isOpen, onClose, messageId }: Props) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        reason: '' as ReportReason | '',
        note: '',
    });

    const handleSubmit = (e: FormEvent): void => {
        e.preventDefault();
        post(route('messages.report', messageId), {
            onSuccess: () => {
                reset();
                onClose();
            },
            preserveScroll: true,
        });
    };

    const handleClose = (): void => {
        if (processing) return;
        reset();
        onClose();
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    <FlagIcon className="h-5 w-5 text-red-500" />
                                    Report Message
                                </DialogTitle>

                                <form
                                    onSubmit={handleSubmit}
                                    className="mt-4 space-y-4"
                                >
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Reason
                                        </label>
                                        <div className="space-y-2">
                                            {REASON_OPTIONS.map((option) => (
                                                <label
                                                    key={option.value}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${data.reason ===
                                                            option.value
                                                            ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300'
                                                            : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="reason"
                                                        value={option.value}
                                                        checked={
                                                            data.reason ===
                                                            option.value
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'reason',
                                                                e.target
                                                                    .value as ReportReason,
                                                            )
                                                        }
                                                        className="sr-only"
                                                    />
                                                    <span
                                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${data.reason ===
                                                                option.value
                                                                ? 'border-red-500 bg-red-500'
                                                                : 'border-slate-300 dark:border-slate-500'
                                                            }`}
                                                    >
                                                        {data.reason ===
                                                            option.value && (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            )}
                                                    </span>
                                                    {option.label}
                                                </label>
                                            ))}
                                        </div>
                                        {errors.reason && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.reason}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="report-note"
                                            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Additional Details{' '}
                                            <span className="text-slate-400">
                                                (optional)
                                            </span>
                                        </label>
                                        <textarea
                                            id="report-note"
                                            rows={3}
                                            maxLength={500}
                                            value={data.note}
                                            onChange={(e) =>
                                                setData('note', e.target.value)
                                            }
                                            placeholder="Describe the issue..."
                                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-red-500 dark:focus:ring-red-500/20"
                                        />
                                        {errors.note && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.note}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            disabled={processing}
                                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={
                                                processing || !data.reason
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <span className="loading loading-spinner loading-xs" />
                                            ) : (
                                                <FlagIcon className="h-4 w-4" />
                                            )}
                                            Submit Report
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ReportMessageModal;
