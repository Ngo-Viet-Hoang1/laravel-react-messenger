import { isAudio, isImage, isPDF, isPreviewable, isVideo } from '@/helpers';
import { Dialog, Transition } from '@headlessui/react';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { PaperClipIcon } from '@heroicons/react/24/solid';
import { Fragment, useEffect, useMemo, useState } from 'react';

export default function AttachmentPreviewModal({
    attachments,
    index,
    show = false,
    onClose = () => {},
}) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const previewableAttachments = useMemo(() => {
        return attachments.filter((attachment) => isPreviewable(attachment));
    }, [attachments]);

    const attachment = useMemo(() => {
        return attachments[currentIndex];
    }, [currentIndex, attachments]);

    const close = () => {
        onClose();
    };
    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };
    const next = () => {
        if (currentIndex === previewableAttachments.length - 1) {
            return;
        }
        setCurrentIndex(currentIndex + 1);
    };
    useEffect(() => {
        setCurrentIndex(index);
    }, [index]);

    return (
        <Transition show={show} as={Fragment} leave="duration-100">
            <Dialog
                as="div"
                id="modal"
                className="relative z-50"
                onClose={close}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="h-screen w-screen">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative flex h-full w-full transform flex-col overflow-hidden bg-slate-800 text-left align-middle shadow-xl transition-all">
                                <button
                                    type="button"
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        close();
                                    }}
                                    className="absolute right-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full text-gray-100 transition hover:bg-black/10"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                                <div className="group relative h-full">
                                    {currentIndex > 0 && (
                                        <div
                                            onClick={prev}
                                            className="absolute left-4 top-1/2 z-30 flex h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-gray-100 opacity-100"
                                        >
                                            <ChevronLeftIcon className="w-12" />
                                        </div>
                                    )}
                                    {currentIndex <
                                        previewableAttachments.length - 1 && (
                                        <div
                                            onClick={next}
                                            className="absolute right-4 top-1/2 z-30 flex h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-gray-100 opacity-100"
                                        >
                                            <ChevronRightIcon className="w-12" />
                                        </div>
                                    )}
                                    {attachment && (
                                        <div className="flex h-full w-full items-center justify-center">
                                            {isImage(attachment) && (
                                                <img
                                                    src={attachment.url}
                                                    className="max-h-full max-w-full"
                                                />
                                            )}
                                            {isVideo(attachment) && (
                                                <div className="relative flex items-center justify-center">
                                                    <video
                                                        src={attachment.url}
                                                        controls
                                                        autoPlay
                                                    />
                                                </div>
                                            )}
                                            {isAudio(attachment) && (
                                                <div className="relative flex items-center justify-center">
                                                    <audio
                                                        src={attachment.url}
                                                        controls
                                                        autoPlay
                                                    />
                                                </div>
                                            )}
                                            {isPDF(attachment) && (
                                                <iframe
                                                    src={attachment.url}
                                                    className="h-full w-full"
                                                />
                                            )}
                                            {!isPreviewable(attachment) && (
                                                <div className="flex h-32 w-32 flex-col items-center justify-center rounded bg-gray-700">
                                                    <PaperClipIcon className="h-10mb-3 w-10" />
                                                    <small>
                                                        {attachment.name}
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
