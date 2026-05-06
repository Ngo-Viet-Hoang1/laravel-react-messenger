import { isAudio, isImage, isPDF, isVideo } from '@/utils';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { type MouseEventHandler, type ReactNode } from 'react';

type ClassNames = {
    image?: string;
    video?: string;
    audio?: string;
    pdf?: string;
};

type Props = {
    url: string;
    mime?: string | null;
    name?: string | null;
    classNames?: ClassNames;
    autoPlay?: boolean;
    onMediaClick?: MouseEventHandler;
    renderFileFallback?: ReactNode;
};

const DEFAULT_CLASSNAMES = {
    image: 'h-full w-full object-cover',
    video: 'h-full w-full object-cover',
    audio: 'w-full',
    pdf: 'h-full w-full',
} satisfies Required<ClassNames>;

const AttachmentMedia = ({
    url,
    mime,
    name,
    classNames,
    autoPlay = false,
    onMediaClick,
    renderFileFallback,
}: Props) => {
    const src = { mime };
    const cls = { ...DEFAULT_CLASSNAMES, ...classNames };

    if (isImage(src)) {
        return (
            <img src={url} alt={name ?? 'Attachment'} className={cls.image} />
        );
    }

    if (isVideo(src)) {
        return (
            <video
                src={url}
                controls
                autoPlay={autoPlay}
                className={`${cls.video} [color-scheme:light] dark:[color-scheme:dark]`}
                onClick={onMediaClick}
            />
        );
    }

    if (isAudio(src)) {
        return (
            <audio
                src={url}
                controls
                autoPlay={autoPlay}
                className={`${cls.audio} [color-scheme:light] dark:[color-scheme:dark]`}
                onClick={onMediaClick}
            />
        );
    }

    if (isPDF(src)) {
        return <iframe src={url} title={name ?? 'PDF'} className={cls.pdf} />;
    }

    if (renderFileFallback != null) {
        return <>{renderFileFallback}</>;
    }

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <DocumentIcon className="h-7 w-7" />
            {name && (
                <span className="max-w-full truncate px-2 text-center text-[11px]">
                    {name}
                </span>
            )}
        </div>
    );
};

export default AttachmentMedia;
