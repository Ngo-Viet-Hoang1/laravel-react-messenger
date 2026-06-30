<?php

namespace App\Http\Controllers;

use App\Models\MessageAttachment;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoStreamController extends Controller
{
    /**
     * Stream the given attachment using HTTP Range Requests (206 Partial Content).
     *
     * @return BinaryFileResponse|StreamedResponse|JsonResponse
     */
    public function stream(Request $request, MessageAttachment $attachment)
    {
        // 1. Authorization check
        $channelId = $attachment->message?->channel_id;
        if (! $channelId) {
            abort(403, 'Unauthorized');
        }

        $isUserInChannel = $request->user()?->channels()->whereKey($channelId)->exists();
        abort_unless($isUserInChannel, 403, 'Unauthorized');

        // 2. Resolve file path
        $disk = $attachment->storage_disk ?? 'public';
        $path = Storage::disk($disk)->path($attachment->path);

        if (! file_exists($path)) {
            abort(404, 'File not found');
        }

        $fileSize = filesize($path);
        $mimeType = $attachment->mime ?: (mime_content_type($path) ?: 'video/mp4');
        $rangeHeader = $request->header('Range');

        // 3. Serve complete file if no Range header is present
        if (! $rangeHeader) {
            return response()->file($path, [
                'Content-Type' => $mimeType,
                'Accept-Ranges' => 'bytes',
            ]);
        }

        // 4. Parse Range header (e.g. bytes=1000-2000, bytes=1000-, bytes=-500)
        try {
            $range = str_replace('bytes=', '', $rangeHeader);
            $parts = explode('-', $range);

            if (count($parts) === 2) {
                if ($parts[0] === '') {
                    // Suffix range (e.g. bytes=-500: last 500 bytes of the file)
                    $suffixLength = (int) $parts[1];
                    $start = max(0, $fileSize - $suffixLength);
                    $end = $fileSize - 1;
                } else {
                    // Normal range (e.g. bytes=1000-2000 or bytes=1000-)
                    $start = (int) $parts[0];
                    $end = ($parts[1] !== '') ? (int) $parts[1] : $fileSize - 1;
                }
            } else {
                $start = 0;
                $end = $fileSize - 1;
            }
        } catch (Exception $e) {
            abort(400, 'Invalid Range header');
        }

        // 5. Validate range boundaries
        if ($start < 0 || $start >= $fileSize || $end < $start || $end >= $fileSize) {
            return response()->json(['error' => 'Requested Range Not Satisfiable'], 416, [
                'Content-Range' => "bytes */{$fileSize}",
            ]);
        }

        $length = $end - $start + 1;

        // 6. Stream content chunk by chunk (1MB chunks)
        return new StreamedResponse(function () use ($path, $start, $length) {
            $stream = fopen($path, 'rb');
            if ($stream === false) {
                return;
            }

            fseek($stream, $start);
            $remaining = $length;
            $chunkSize = 1024 * 1024; // 1MB chunk size

            while ($remaining > 0 && ! feof($stream)) {
                $read = min($chunkSize, $remaining);
                $data = fread($stream, $read);
                if ($data === false) {
                    break;
                }
                echo $data;
                $remaining -= strlen($data);

                if (connection_aborted()) {
                    break;
                }
                flush();
            }
            fclose($stream);
        }, 206, [
            'Content-Type' => $mimeType,
            'Content-Length' => $length,
            'Content-Range' => "bytes {$start}-{$end}/{$fileSize}",
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'no-cache, must-revalidate',
        ]);
    }
}
