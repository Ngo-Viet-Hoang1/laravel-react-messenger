import { MessageAttachment } from '@/types';
import { isAudio, isImage, isPDF, isVideo } from '@/utils';
import {
    ArrowDownTrayIcon,
    DocumentIcon,
    MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import AttachmentMedia from './AttachmentMedia';

type Props = {
    attachments: MessageAttachment[];
    onAttachmentClick?: (
        attachments: MessageAttachment[],
        index: number,
    ) => void;
};

const CARD_BASE =
    'flex w-full max-w-[320px] sm:max-w-[380px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700/60 dark:bg-slate-800';

const ICON_WRAPPER =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg';

const OVERLAY_DOWNLOAD_BTN =
    'absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/70 group-hover:opacity-100';

const MessageAttachments = ({ attachments, onAttachmentClick }: Props) => {
    if (attachments.length === 0) return null;

    const allWithIndex = attachments.map((a, i) => ({
        attachment: a,
        index: i,
    }));
    const mediaItems = allWithIndex.filter(
        ({ attachment }) =>
            (isImage(attachment) || isVideo(attachment)) &&
            !isAudio(attachment),
    );
    const nonMediaItems = allWithIndex.filter(
        ({ attachment }) =>
            (!isImage(attachment) && !isVideo(attachment)) ||
            isAudio(attachment),
    );

    return (
        <div className="mt-1.5 flex flex-col gap-2">
            {/* ── Media Group (Images & Videos) ── */}
            {mediaItems.length > 0 ? (
                <div className="flex flex-col items-start gap-1.5">
                    {mediaItems.map(({ attachment, index }) => {
                        return (
                            <div
                                key={attachment.id}
                                className="group relative flex w-fit max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700/60 dark:bg-slate-900"
                                onClick={() =>
                                    onAttachmentClick?.(attachments, index)
                                }
                            >
                                <a
                                    href={attachment.url}
                                    download
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={OVERLAY_DOWNLOAD_BTN}
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                </a>

                                <AttachmentMedia
                                    url={attachment.url}
                                    mime={attachment.mime}
                                    name={attachment.name}
                                    streamUrl={attachment.stream_url}
                                    thumbnailUrl={attachment.thumbnail_url}
                                    onMediaClick={(e) => e.stopPropagation()}
                                    classNames={{
                                        image: 'h-auto w-auto max-h-[350px] max-w-full object-contain',
                                        video: 'h-auto w-auto max-h-[350px] max-w-full',
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {/* ── Files / PDF / Audio Group ── */}
            {nonMediaItems.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {nonMediaItems.map(({ attachment, index }) => {
                        if (isAudio(attachment)) {
                            return (
                                <div
                                    key={attachment.id}
                                    className={`${CARD_BASE} p-2.5`}
                                >
                                    <div className="mb-1.5 flex items-center gap-2 px-1">
                                        <MusicalNoteIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                                        <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                                            {attachment.name}
                                        </span>
                                    </div>
                                    <audio
                                        src={attachment.url}
                                        controls
                                        className="h-10 w-full scheme-light dark:scheme-dark"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            );
                        }

                        if (isPDF(attachment)) {
                            return (
                                <div
                                    key={attachment.id}
                                    className={`${CARD_BASE} group cursor-pointer hover:border-slate-300 dark:hover:border-slate-600`}
                                    onClick={() =>
                                        onAttachmentClick?.(attachments, index)
                                    }
                                >
                                    <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-700">
                                        <iframe
                                            src={attachment.url}
                                            title={attachment.name}
                                            className="h-full w-full select-none"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <div className="absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/10 dark:bg-black/10" />
                                    </div>
                                    <div className="flex items-center gap-3 border-t border-slate-100 p-2 dark:border-slate-700">
                                        <div
                                            className={`${ICON_WRAPPER} bg-red-50 text-red-500 dark:bg-red-500/10`}
                                        >
                                            <DocumentIcon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {attachment.name}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                PDF Document
                                            </p>
                                        </div>
                                        <a
                                            href={attachment.url}
                                            download
                                            onClick={(e) => e.stopPropagation()}
                                            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                        >
                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            );
                        }

                        /* ── Generic File ── */
                        return (
                            <a
                                key={attachment.id}
                                href={attachment.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`${CARD_BASE} group cursor-pointer p-2 hover:border-slate-300 dark:hover:border-slate-600`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`${ICON_WRAPPER} bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10`}
                                    >
                                        <DocumentIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {attachment.name}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Download File
                                        </p>
                                    </div>
                                    <div className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-300">
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

export default MessageAttachments;
