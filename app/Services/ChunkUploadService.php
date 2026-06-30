<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use RuntimeException;

class ChunkUploadService
{
    /**
     * Handle the upload of a chunk fragment.
     *
     * @param  string  $fileUuid  The unique identifier of the file.
     * @param  int  $chunkIndex  The index of the current chunk fragment (0-indexed).
     * @param  int  $totalChunks  The total number of chunk fragments.
     * @param  string  $fileName  The original name of the file.
     * @param  string  $fileMime  The MIME type of the file.
     * @param  int  $fileSize  The total size of the file in bytes.
     * @param  UploadedFile  $chunkFile  The uploaded chunk file.
     * @return array{status: string, path?: string, name?: string, mime?: string, size?: int, progress?: float}
     *
     * @throws RuntimeException If the output stream or individual chunks fail to open.
     */
    public function uploadChunk(
        string $fileUuid,
        int $chunkIndex,
        int $totalChunks,
        string $fileName,
        string $fileMime,
        int $fileSize,
        UploadedFile $chunkFile
    ): array {
        $tempDir = storage_path('app/chunks/'.$fileUuid);
        if (! file_exists($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $chunkFile->move($tempDir, (string) $chunkIndex);

        $uploadedCount = 0;
        for ($i = 0; $i < $totalChunks; $i++) {
            if (file_exists($tempDir.'/'.$i)) {
                $uploadedCount++;
            }
        }

        if ($uploadedCount === $totalChunks) {
            $mergedFilePath = $tempDir.'/merged';
            $out = fopen($mergedFilePath, 'wb');
            if ($out === false) {
                throw new RuntimeException('Failed to open output stream');
            }

            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkPath = $tempDir.'/'.$i;
                $in = fopen($chunkPath, 'rb');
                if ($in === false) {
                    fclose($out);
                    throw new RuntimeException('Failed to open chunk '.$i);
                }
                while ($buff = fread($in, 4096)) {
                    fwrite($out, $buff);
                }
                fclose($in);
            }
            fclose($out);

            // Clean up chunks
            for ($i = 0; $i < $totalChunks; $i++) {
                @unlink($tempDir.'/'.$i);
            }

            return [
                'status' => 'completed',
                'path' => 'chunks/'.$fileUuid.'/merged',
                'name' => $fileName,
                'mime' => $fileMime,
                'size' => $fileSize,
            ];
        }

        return [
            'status' => 'uploading',
            'progress' => round(($uploadedCount / $totalChunks) * 100),
        ];
    }
}
