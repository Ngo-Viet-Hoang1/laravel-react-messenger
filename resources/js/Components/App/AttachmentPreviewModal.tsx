import { MessageAttachment } from '@/types';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
    ArrowDownTrayIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import AttachmentMedia from './AttachmentMedia';

type Props = {
    index: number;
    isShow: boolean;
    onClose: () => void;
    attachments: MessageAttachment[];
};

const AttachmentPreviewModal = ({
    index,
    isShow,
    onClose,
    attachments,
}: Props) => {
    const [currentIndex, setCurrentIndex] = useState(index);

    useEffect(() => {
        setCurrentIndex(index);
    }, [index]);

    const attachment = attachments[currentIndex];
    const showNav = attachments.length > 1;

    useEffect(() => {
        if (!isShow || attachments.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                setCurrentIndex((p) => (p + 1) % attachments.length);
            } else if (e.key === 'ArrowLeft') {
                setCurrentIndex(
                    (p) => (p - 1 + attachments.length) % attachments.length,
                );
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isShow, attachments.length]);

    return (
        <Dialog open={isShow} onClose={onClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

            <DialogPanel className="fixed inset-0 flex h-full w-full flex-col">
                <div className="flex shrink-0 items-center justify-between px-4 py-3">
                    <span className="truncate text-sm font-medium text-white/80">
                        {attachment?.name}
                    </span>

                    <div className="flex shrink-0 items-center gap-2">
                        {attachments.length > 1 && (
                            <span className="text-xs text-white/50">
                                {currentIndex + 1} / {attachments.length}
                            </span>
                        )}

                        {attachment && (
                            <a
                                href={attachment.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Download"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-12 pt-4">
                    {showNav && (
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentIndex(
                                    (p) =>
                                        (p - 1 + attachments.length) %
                                        attachments.length,
                                )
                            }
                            aria-label="Previous"
                            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:left-3"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                    )}

                    {showNav && (
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentIndex(
                                    (p) => (p + 1) % attachments.length,
                                )
                            }
                            aria-label="Next"
                            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-3"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    )}

                    {/* Media */}
                    {attachment && (
                        <AttachmentMedia
                            url={attachment.url}
                            mime={attachment.mime}
                            name={attachment.name}
                            autoPlay
                            classNames={{
                                image: 'max-h-full max-w-full rounded-lg object-contain shadow-2xl',
                                video: 'max-h-full max-w-full rounded-lg shadow-2xl',
                                audio: 'w-full max-w-md rounded-xl',
                                pdf: 'h-full w-full rounded-lg',
                            }}
                            renderFileFallback={
                                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/10 px-10 py-8 text-white backdrop-blur-sm">
                                    <DocumentIcon className="h-12 w-12 opacity-70" />
                                    <p className="max-w-[200px] break-words text-center text-sm font-medium">
                                        {attachment.name}
                                    </p>
                                    <a
                                        href={attachment.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-white/30"
                                    >
                                        Download
                                    </a>
                                </div>
                            }
                        />
                    )}
                </div>

                {/* Dot indicators */}
                {attachments.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 justify-center gap-1.5">
                        {attachments.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setCurrentIndex(i)}
                                aria-label={`Go to attachment ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-200 ${
                                    i === currentIndex
                                        ? 'w-4 bg-white'
                                        : 'w-1.5 bg-white/40 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </DialogPanel>
        </Dialog>
    );
};

export default AttachmentPreviewModal;
