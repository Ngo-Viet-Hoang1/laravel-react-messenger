import * as React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { formatBytes, getFileMeta, FileIcon } from '@/shared/lib';
import { type PendingUploadItem } from '../model/useAttachmentUpload';

interface AttachmentPreviewListProps {
  items: PendingUploadItem[];
  onRemove: (id: string) => void;
}

export const AttachmentPreviewList: React.FC<AttachmentPreviewListProps> = ({
  items,
  onRemove,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5 px-3 pt-2.5 pb-1">
      {items.map((item) => {
        const meta = getFileMeta(item.name, item.contentType);

        return (
          <div
            key={item.id}
            className="group relative flex w-full sm:w-60 max-w-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card p-2 text-xs shadow-xs transition-all hover:border-border hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              {item.previewUrl ? (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  {item.status === 'completed' && (
                    <div className="absolute right-0.5 bottom-0.5 rounded-full bg-emerald-500 p-0.5 text-white shadow-xs">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted/80">
                  <FileIcon iconKind={meta.iconKind} className={`h-5 w-5 ${meta.textClass}`} />
                  {item.status === 'completed' && (
                    <div className="absolute -top-1 -right-1 rounded-full bg-emerald-500 p-0.5 text-white shadow-xs">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="truncate font-medium text-foreground" title={item.name}>
                  {item.name}
                </span>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="h-4 px-1 py-0 text-[10px] font-semibold">
                    {meta.extension}
                  </Badge>
                  <span>{formatBytes(item.size)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="cursor-pointer rounded-full p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                title="Remove attachment"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar & Status Feedback */}
            {item.status === 'uploading' && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Uploading to storage...</span>
                  <span className="font-semibold text-primary">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-1 w-full bg-muted" />
              </div>
            )}

            {item.status === 'error' && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.error || 'Upload failed'}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
