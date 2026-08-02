<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class VideoThumbnailService
{
    /**
     * Generate a thumbnail image for a video file.
     *
     * @param  string  $videoRelativePath  Relative path of the video file.
     * @param  string  $disk  Storage disk name.
     * @return string|null Relative path of the generated thumbnail, or null if failed.
     */
    public function generate(string $videoRelativePath, string $disk = 'public'): ?string
    {
        $videoFullPath = Storage::disk($disk)->path($videoRelativePath);

        if (! file_exists($videoFullPath)) {
            Log::warning("VideoThumbnailService: Video file does not exist at {$videoFullPath}");

            return null;
        }

        $filenameWithoutExt = pathinfo($videoRelativePath, PATHINFO_FILENAME);
        $thumbnailRelativePath = dirname($videoRelativePath).'/'.$filenameWithoutExt.'_thumb.jpg';
        $thumbnailFullPath = Storage::disk($disk)->path($thumbnailRelativePath);

        $escapedVideoPath = escapeshellarg($videoFullPath);
        $escapedThumbnailPath = escapeshellarg($thumbnailFullPath);

        // Command: extract 1 frame at 00:00:01 and overwrite output
        $command = "ffmpeg -ss 00:00:01 -i {$escapedVideoPath} -vframes 1 {$escapedThumbnailPath} -y 2>&1";

        try {
            $output = [];
            $resultCode = -1;
            exec($command, $output, $resultCode);

            if ($resultCode !== 0) {
                $errorMsg = implode("\n", $output);
                Log::warning("VideoThumbnailService: ffmpeg failed with code {$resultCode}. Command: {$command}. Output: {$errorMsg}");

                return null;
            }

            if (! file_exists($thumbnailFullPath)) {
                Log::warning("VideoThumbnailService: ffmpeg ran but thumbnail file was not created at {$thumbnailFullPath}");

                return null;
            }

            return $thumbnailRelativePath;
        } catch (Throwable $e) {
            Log::error('VideoThumbnailService: exception caught: '.$e->getMessage());

            return null;
        }
    }
}
