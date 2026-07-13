import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Download, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { formatBytes, getFileMeta, FileIcon } from '@/shared/lib';
import { cn } from '@/shared/lib/utils';
import type { MessageAttachmentDto } from '../model/types';

interface MessageAttachmentsProps {
  attachments?: MessageAttachmentDto[] | null;
  className?: string;
}

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  className,
}) => {
  const [selectedImage, setSelectedImage] = React.useState<{ url: string; name: string } | null>(
    null
  );

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.contentType.startsWith('image/'));
  const videos = attachments.filter((a) => a.contentType.startsWith('video/'));
  const audios = attachments.filter((a) => a.contentType.startsWith('audio/'));
  const documents = attachments.filter(
    (a) =>
      !a.contentType.startsWith('image/') &&
      !a.contentType.startsWith('video/') &&
      !a.contentType.startsWith('audio/')
  );

  const handleMediaLoad = () => {
    // Notify TanStack Virtualizer of dynamic size update
    window.dispatchEvent(new Event('resize'));
  };

  return (
    <div className={cn('mt-2 flex max-w-full flex-col items-start gap-2.5', className)}>
      {/* Images: Clean responsive grid or single preview */}
      {images.length > 0 && (
        <div
          className={
            images.length === 1
              ? 'max-w-xs sm:max-w-sm'
              : 'grid max-w-xs grid-cols-2 gap-2 sm:max-w-sm'
          }
        >
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage({ url: img.url, name: img.fileName })}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-border/50 bg-muted/20 shadow-2xs transition-all hover:border-primary/50"
            >
              <img
                src={img.url}
                alt={img.fileName}
                loading="lazy"
                onLoad={handleMediaLoad}
                className={
                  images.length === 1
                    ? 'block max-h-64 w-auto max-w-full rounded-lg object-contain sm:max-h-72'
                    : 'aspect-square h-full w-full object-cover'
                }
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </div>
          ))}
        </div>
      )}

      {/* Videos: Range 206 streaming player */}
      {videos.map((vid) => (
        <div
          key={vid.id}
          className="relative w-full max-w-xs overflow-hidden rounded-lg border border-border/50 bg-black shadow-xs sm:max-w-sm"
        >
          <video
            key={vid.url}
            src={vid.url}
            controls
            playsInline
            preload="metadata"
            poster={vid.thumbnailUrl || undefined}
            onLoadedMetadata={handleMediaLoad}
            className="max-h-64 w-full object-contain"
          >
            Your browser does not support HTML5 video playback.
          </video>
        </div>
      ))}

      {/* 3. Audio: Native audio card */}
      {audios.map((aud) => (
        <div
          key={aud.id}
          className="flex w-full max-w-xs flex-col gap-1.5 rounded-lg border border-border/60 bg-card/60 p-3 shadow-2xs sm:max-w-sm"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="truncate font-medium text-foreground">{aud.fileName}</span>
            <span className="text-[11px] text-muted-foreground">
              {formatBytes(aud.fileSizeBytes)}
            </span>
          </div>
          <audio key={aud.url} src={aud.url} controls preload="metadata" className="w-full">
            Your browser does not support audio playback.
          </audio>
        </div>
      ))}

      {/* Documents & Files: Clean card with download */}
      {documents.map((doc) => {
        const meta = getFileMeta(doc.fileName, doc.contentType);

        return (
          <div
            key={doc.id}
            className="group flex w-full max-w-xs items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/70 p-3 shadow-2xs transition-all hover:border-primary/40 hover:bg-card sm:max-w-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border ${meta.badgeClass}`}
              >
                <FileIcon iconKind={meta.iconKind} className={`h-4.5 w-4.5 ${meta.textClass}`} />
                <span className="text-[9px] font-bold tracking-tight">{meta.extension}</span>
              </div>

              <div className="flex min-w-0 flex-col">
                <span
                  title={doc.fileName}
                  className="truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary"
                >
                  {doc.fileName}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{formatBytes(doc.fileSizeBytes)}</span>
                  <span>•</span>
                  <span>{meta.category}</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 cursor-pointer rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.fileName}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        );
      })}

      {/* Simple, unconstrained Fullscreen Lightbox */}
      <DialogPrimitive.Root
        open={Boolean(selectedImage)}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="animate-in fade-in-0 fixed inset-0 z-50 bg-black/85 backdrop-blur-xs duration-150" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 outline-none focus:outline-none"
            onClick={() => setSelectedImage(null)}
          >
            <DialogPrimitive.Title className="sr-only">
              {selectedImage?.name || 'Image Preview'}
            </DialogPrimitive.Title>

            {selectedImage && (
              <div
                className="relative flex max-h-full max-w-full flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Actions Bar */}
                <div className="mb-2 flex w-full items-center justify-between gap-3 text-white">
                  <span className="max-w-xs truncate text-xs font-medium sm:max-w-md">
                    {selectedImage.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedImage.url}
                      download={selectedImage.name}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs text-white backdrop-blur-md transition-colors hover:bg-white/20"
                      title="Download full image"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                    <DialogPrimitive.Close
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                      title="Close preview"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                  </div>
                </div>

                {/* Main Full-Size Image */}
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="max-h-[82vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
                />
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
};
