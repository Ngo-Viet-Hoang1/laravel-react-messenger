import { type ParentMessage } from '@/types';
import { isAudio, isImage, isPDF, isVideo } from '@/utils';

type Props = {
    message: ParentMessage;
    onCancel?: () => void;
};

const getReplySummary = (message: ParentMessage): string => {
    const content = message.content?.trim();
    if (content) return content;

    const attachments = message.attachments ?? [];
    if (attachments.length === 0) return 'Deleted message';

    const [firstAttachment] = attachments;
    const extraCount = attachments.length - 1;
    const extraLabel = extraCount > 0 ? ` +${extraCount}` : '';

    if (isImage(firstAttachment)) return `Picture Attachment${extraLabel}`;
    if (isVideo(firstAttachment)) return `Video Attachment${extraLabel}`;
    if (isAudio(firstAttachment)) return `Audio Attachment${extraLabel}`;
    if (isPDF(firstAttachment)) return `PDF Attachment${extraLabel}`;

    return firstAttachment.name
        ? `File: ${firstAttachment.name}${extraLabel}`
        : `Attachment${extraLabel}`;
};

const ReplyPreview = ({ message, onCancel }: Props) => {
    const summary = getReplySummary(message);

    return (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-300/70 bg-white/50 px-3 py-2 text-sm text-slate-600 dark:border-slate-600/70 dark:bg-slate-800/50 dark:text-slate-300">
            <div className="min-w-0">
                <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide opacity-70">
                    Replying to {message.sender.name}
                </div>
                <div className="line-clamp-2 break-words">{summary}</div>
            </div>

            {onCancel ? (
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                >
                    Cancel
                </button>
            ) : null}
        </div>
    );
};

export default ReplyPreview;
