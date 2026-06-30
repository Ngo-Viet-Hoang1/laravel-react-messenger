<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Tests\TestCase;

class ChunkUploadTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function tearDown(): void
    {
        // Clean up any test chunks directory
        $tempChunksDir = storage_path('app/chunks');
        if (file_exists($tempChunksDir)) {
            $this->deleteDir($tempChunksDir);
        }

        parent::tearDown();
    }

    private function deleteDir(string $dirPath): void
    {
        if (! is_dir($dirPath)) {
            return;
        }
        $files = array_diff(scandir($dirPath), ['.', '..']);
        foreach ($files as $file) {
            $filePath = $dirPath.'/'.$file;
            if (is_dir($filePath)) {
                $this->deleteDir($filePath);
            } else {
                @unlink($filePath);
            }
        }
        @rmdir($dirPath);
    }

    public function test_guest_cannot_upload_chunk(): void
    {
        $response = $this->postJson(route('messages.upload-chunk'), [
            'file_uuid' => Str::uuid()->toString(),
            'chunk_index' => 0,
            'total_chunks' => 2,
            'name' => 'test.txt',
            'size' => 10,
            'mime' => 'text/plain',
            'file' => UploadedFile::fake()->create('chunk1.txt', 5),
        ]);

        $response->assertUnauthorized();
    }

    public function test_chunk_upload_validation_rules(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson(route('messages.upload-chunk'), []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['file_uuid', 'chunk_index', 'total_chunks', 'name', 'size', 'mime', 'file']);
    }

    public function test_can_upload_chunks_and_merge_successfully(): void
    {
        $user = User::factory()->create();
        $fileUuid = Str::uuid()->toString();

        // 1. Upload first chunk (0 of 2)
        $chunk1 = UploadedFile::fake()->createWithContent('chunk0.txt', 'Hello ');
        $response1 = $this->actingAs($user)
            ->postJson(route('messages.upload-chunk'), [
                'file_uuid' => $fileUuid,
                'chunk_index' => 0,
                'total_chunks' => 2,
                'name' => 'greeting.txt',
                'size' => 12,
                'mime' => 'text/plain',
                'file' => $chunk1,
            ]);

        $response1->assertOk();
        $response1->assertJson([
            'status' => 'uploading',
            'progress' => 50,
        ]);

        // Verify chunk 0 file exists in temp directory
        $this->assertFileExists(storage_path('app/chunks/'.$fileUuid.'/0'));

        // 2. Upload second/final chunk (1 of 2)
        $chunk2 = UploadedFile::fake()->createWithContent('chunk1.txt', 'World!');
        $response2 = $this->actingAs($user)
            ->postJson(route('messages.upload-chunk'), [
                'file_uuid' => $fileUuid,
                'chunk_index' => 1,
                'total_chunks' => 2,
                'name' => 'greeting.txt',
                'size' => 12,
                'mime' => 'text/plain',
                'file' => $chunk2,
            ]);

        $response2->assertOk();
        $response2->assertJson([
            'status' => 'completed',
            'path' => 'chunks/'.$fileUuid.'/merged',
            'name' => 'greeting.txt',
            'mime' => 'text/plain',
            'size' => 12,
        ]);

        // Verify individual chunks are cleaned up
        $this->assertFileDoesNotExist(storage_path('app/chunks/'.$fileUuid.'/0'));
        $this->assertFileDoesNotExist(storage_path('app/chunks/'.$fileUuid.'/1'));

        // Verify merged file exists and content is correct
        $mergedPath = storage_path('app/chunks/'.$fileUuid.'/merged');
        $this->assertFileExists($mergedPath);
        $this->assertEquals('Hello World!', file_get_contents($mergedPath));
    }
}
