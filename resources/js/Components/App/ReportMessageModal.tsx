import InputError from '@/Components/Breeze/InputError';
import InputLabel from '@/Components/Breeze/InputLabel';
import Modal from '@/Components/Breeze/Modal';
import TextAreaInput from '@/Components/Breeze/TextAreaInput';
import { REASON_OPTIONS } from '@/constants/reports';
import { type ReportReason } from '@/types/report';
import { FlagIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

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
        <Modal show={isOpen} onClose={handleClose} maxWidth="md">
            <div className="p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                    <FlagIcon className="h-5 w-5 text-red-500" />
                    Report Message
                </h3>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <InputLabel value="Reason" className="mb-1.5" />
                        <div className="space-y-2">
                            {REASON_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                                        data.reason === option.value
                                            ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300'
                                            : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={option.value}
                                        checked={data.reason === option.value}
                                        onChange={(e) =>
                                            setData(
                                                'reason',
                                                e.target.value as ReportReason,
                                            )
                                        }
                                        className="sr-only"
                                    />
                                    <span
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                            data.reason === option.value
                                                ? 'border-red-500 bg-red-500'
                                                : 'border-slate-300 dark:border-slate-500'
                                        }`}
                                    >
                                        {data.reason === option.value && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                        )}
                                    </span>
                                    {option.label}
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.reason} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="report-note" className="mb-1.5">
                            <span>Additional Details </span>
                            <span className="text-slate-400">(optional)</span>
                        </InputLabel>
                        <TextAreaInput
                            id="report-note"
                            rows={3}
                            maxLength={500}
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                            placeholder="Describe the issue..."
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-red-500 dark:focus:ring-red-500/20"
                        />
                        <InputError message={errors.note} className="mt-1" />
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
                            disabled={processing || !data.reason}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <span className="loading loading-xs loading-spinner" />
                            ) : (
                                <FlagIcon className="h-4 w-4" />
                            )}
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
export default ReportMessageModal;
