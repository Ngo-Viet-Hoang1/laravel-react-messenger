import { type ParentMessage } from '@/types';
import { isAudio, isImage, isPDF, isVideo } from '@/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-black/5 px-3 py-2 text-sm dark:bg-white/10">
            <div className="min-w-0 opacity-90">
                <div className="mb-0.5 text-[0.7rem] font-bold tracking-wider uppercase opacity-70">
                    Replying to {message.sender.name}
                </div>
                <div className="line-clamp-2 wrap-break-word">{summary}</div>
            </div>

            {onCancel ? (
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full p-1 opacity-60 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
                    title="Cancel reply"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            ) : null}
        </div>
    );
};

export default ReplyPreview;
