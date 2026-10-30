export { formatBytes as formatFileSize } from '@/shared/lib';

export interface VideoMetadata {
  thumbnailBlob: Blob | null;
  width: number;
  height: number;
  durationSeconds: number;
}

export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const durationSeconds = Math.round(video.duration) || 0;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 360;

      // Seek to 0.5s or midpoint for short clips
      video.currentTime = Math.min(0.5, video.duration / 2 || 0);

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 1280);
          canvas.height = Math.round((canvas.width / width) * height);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                cleanup();
                resolve({
                  thumbnailBlob: blob,
                  width,
                  height,
                  durationSeconds,
                });
              },
              'image/webp',
              0.85
            );
            return;
          }
        } catch {
          // Canvas capture failure fallback
        }

        cleanup();
        resolve({
          thumbnailBlob: null,
          width,
          height,
          durationSeconds,
        });
      };
    };

    video.onerror = () => {
      cleanup();
      resolve({
        thumbnailBlob: null,
        width: 0,
        height: 0,
        durationSeconds: 0,
      });
    };
  });
}

export async function extractImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0 });
    };
  });
}

export async function uploadSinglePart(
  url: string,
  data: Blob | File,
  contentType: string,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: data,
    signal,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with HTTP ${res.status}: ${res.statusText}`);
  }

  onProgress?.(data.size, data.size);

  const etag = res.headers.get("ETag") || "";
  return etag.replace(/^"|"$/g, "");
}
