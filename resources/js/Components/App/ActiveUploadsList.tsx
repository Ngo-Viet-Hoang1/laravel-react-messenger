import { useUploads } from '@/Contexts/UploadContext';
import { formatFileSize } from '@/utils';
import { UPLOAD_STATUS_CONFIG } from '@/utils/chunkedUpload';
import { XMarkIcon } from '@heroicons/react/24/outline';

type Props = {
    channelId: number;
};

const ActiveUploadsList = ({ channelId }: Props) => {
    const { uploads, cancelUpload, clearUpload } = useUploads();

    const channelUploads = uploads.filter((u) => u.channelId === channelId);

    if (channelUploads.length === 0) return null;

    return (
        <div className="mx-2 mb-2 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Sending files ({channelUploads.length})
            </div>
            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
                {channelUploads.map((upload) => {
                    const isUploading = upload.status === 'uploading';
                    const config = UPLOAD_STATUS_CONFIG[upload.status];

                    return (
                        <div
                            key={upload.id}
                            className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2 text-xs transition-colors dark:bg-slate-800"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium text-slate-800 dark:text-slate-200">
                                        {upload.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {formatFileSize(upload.size)}
                                        {isUploading
                                            ? ` • ${upload.progress}%`
                                            : config.label}
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            isUploading
                                                ? cancelUpload(upload.id)
                                                : clearUpload(upload.id)
                                        }
                                        className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                        title={
                                            isUploading
                                                ? 'Cancel upload'
                                                : 'Clear'
                                        }
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <progress
                                value={
                                    isUploading ? upload.progress : config.value
                                }
                                max={100}
                                className={`progress ${config.progressClass} h-1.5 w-full${config.opaque ? 'opacity-50' : ''}`}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActiveUploadsList;
