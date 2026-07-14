import * as React from 'react';
import { toast } from 'sonner';
import { messageApi } from '@/entities/message';
import { useSecretChatStore } from '@/features/secret-chat';
import { encryptFile } from '@/shared/lib/crypto/passphraseCrypto';
import {
  extractVideoMetadata,
  extractImageDimensions,
  uploadSinglePart,
} from '../lib/uploadHelper';

export const MAX_ATTACHMENTS = 10;
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export interface PendingUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  contentType: string;
  previewUrl?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  attachmentId?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  abortController: AbortController;
}

export function useAttachmentUpload(channelId?: string, isSecret = false) {
  const [items, setItems] = React.useState<PendingUploadItem[]>([]);

  const removeAttachment = React.useCallback(
    (id: string) => {
      setItems((prev) => {
        const target = prev.find((item) => item.id === id);
        if (target) {
          target.abortController.abort();
          if (target.previewUrl) {
            URL.revokeObjectURL(target.previewUrl);
          }
          if (channelId && target.attachmentId) {
            messageApi.abortUpload(channelId, target.attachmentId).catch(() => {});
          }
        }
        return prev.filter((item) => item.id !== id);
      });
    },
    [channelId]
  );

  const clearAttachments = React.useCallback(() => {
    setItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  }, []);

  const addFiles = React.useCallback(
    async (files: File[]) => {
      if (!channelId || files.length === 0) return;
      if (isSecret) {
        const roomKey = useSecretChatStore.getState().keys[channelId];
        if (!roomKey) {
          toast.error('Please unlock the secret chat before attaching files.');
          return;
        }
      }

      const currentCount = items.length;
      if (currentCount >= MAX_ATTACHMENTS) {
        toast.error('You can only attach up to 10 files per message.');
        return;
      }

      let selectedFiles = files;
      if (currentCount + selectedFiles.length > MAX_ATTACHMENTS) {
        toast.warning(`Only ${MAX_ATTACHMENTS - currentCount} more file(s) allowed (maximum 10).`);
        selectedFiles = selectedFiles.slice(0, MAX_ATTACHMENTS - currentCount);
      }

      for (const file of selectedFiles) {
        if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE_BYTES) {
          toast.error(`Video "${file.name}" exceeds the 100MB size limit.`);
          continue;
        }

        const clientTempId = crypto.randomUUID();
        const abortController = new AbortController();
        let previewUrl: string | undefined;

        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }

        const newItem: PendingUploadItem = {
          id: clientTempId,
          file,
          name: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
          previewUrl,
          progress: 5,
          status: 'uploading',
          abortController,
        };

        setItems((prev) => [...prev, newItem]);

        // Background direct upload execution
        (async () => {
          try {
            let width: number | undefined;
            let height: number | undefined;
            let durationSeconds: number | undefined;
            let thumbnailBlob: Blob | null = null;

            if (file.type.startsWith('video/')) {
              const meta = await extractVideoMetadata(file);
              width = meta.width;
              height = meta.height;
              durationSeconds = meta.durationSeconds;
              thumbnailBlob = !isSecret ? meta.thumbnailBlob : null;
              if (thumbnailBlob && !previewUrl) {
                previewUrl = URL.createObjectURL(thumbnailBlob);
                setItems((prev) =>
                  prev.map((it) => (it.id === clientTempId ? { ...it, previewUrl } : it))
                );
              }
            } else if (file.type.startsWith('image/')) {
              const dims = await extractImageDimensions(file);
              width = dims.width;
              height = dims.height;
            }

            if (abortController.signal.aborted) return;

            let uploadPayload: Blob | File = file;
            if (isSecret) {
              const roomKey = useSecretChatStore.getState().keys[channelId];
              if (!roomKey) throw new Error('Secret room is locked');
              uploadPayload = await encryptFile(file, roomKey);
            }

            // Backend presign contract
            const presign = await messageApi.createPresignedUpload(channelId, {
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              fileSizeBytes: uploadPayload.size,
              width,
              height,
              durationSeconds,
              hasThumbnail: Boolean(thumbnailBlob),
            });

            setItems((prev) =>
              prev.map((it) =>
                it.id === clientTempId
                  ? {
                      ...it,
                      attachmentId: presign.attachmentId,
                      width,
                      height,
                      durationSeconds,
                      progress: 15,
                    }
                  : it
              )
            );

            if (abortController.signal.aborted) return;

            // Direct binary transfer to MinIO
            if (presign.isMultipart && presign.parts && presign.parts.length > 0) {
              const partSize = Number(presign.partSizeBytes) || 10 * 1024 * 1024;
              const completedParts: { partNumber: number; eTag: string }[] = [];

              for (let i = 0; i < presign.parts.length; i++) {
                if (abortController.signal.aborted) return;

                const part = presign.parts[i];
                const start = i * partSize;
                const end = Math.min(start + partSize, uploadPayload.size);
                const chunk = uploadPayload.slice(start, end);

                const eTag = await uploadSinglePart(
                  part.uploadUrl,
                  chunk,
                  'application/octet-stream',
                  (loaded, total) => {
                    const basePartRatio = (i / presign.parts!.length) * 80;
                    const thisPartRatio = (loaded / total) * (80 / presign.parts!.length);
                    const overall = Math.min(95, Math.round(15 + basePartRatio + thisPartRatio));
                    setItems((prev) =>
                      prev.map((it) => (it.id === clientTempId ? { ...it, progress: overall } : it))
                    );
                  },
                  abortController.signal
                );

                completedParts.push({
                  partNumber: Number(part.partNumber),
                  eTag,
                });
              }

              // Complete multipart upload
              await messageApi.completeUpload(channelId, presign.attachmentId, {
                parts: completedParts,
              });
            } else if (presign.uploadUrl) {
              // Single PUT direct to MinIO
              await uploadSinglePart(
                presign.uploadUrl,
                uploadPayload,
                uploadPayload.type || 'application/octet-stream',
                (loaded, total) => {
                  const pct = Math.min(95, Math.round(15 + (loaded / total) * 75));
                  setItems((prev) =>
                    prev.map((it) => (it.id === clientTempId ? { ...it, progress: pct } : it))
                  );
                },
                abortController.signal
              );

              await messageApi.completeUpload(channelId, presign.attachmentId, {});
            }

            // Upload video thumbnail if present
            if (presign.thumbnailUploadUrl && thumbnailBlob) {
              await uploadSinglePart(
                presign.thumbnailUploadUrl,
                thumbnailBlob,
                'image/webp',
                undefined,
                abortController.signal
              );
            }

            // 4. Success state
            setItems((prev) =>
              prev.map((it) =>
                it.id === clientTempId ? { ...it, progress: 100, status: 'completed' } : it
              )
            );
          } catch (err: unknown) {
            if (abortController.signal.aborted) return;
            const message = err instanceof Error ? err.message : 'Upload failed';
            setItems((prev) =>
              prev.map((it) =>
                it.id === clientTempId ? { ...it, status: 'error', error: message } : it
              )
            );
          }
        })();
      }
    },
    [channelId, items.length, isSecret]
  );

  const isUploading = items.some((i) => i.status === 'uploading');
  const completedAttachmentIds = items
    .filter((i) => i.status === 'completed' && i.attachmentId)
    .map((i) => i.attachmentId!);

  return {
    items,
    addFiles,
    removeAttachment,
    clearAttachments,
    isUploading,
    completedAttachmentIds,
    hasAttachments: items.length > 0,
  };
}
