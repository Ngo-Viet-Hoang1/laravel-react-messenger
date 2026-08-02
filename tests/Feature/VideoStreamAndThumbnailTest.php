<?php

namespace Tests\Feature;

use App\Http\Resources\MessageAttachmentResource;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use App\Services\VideoThumbnailService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoStreamAndThumbnailTest extends TestCase
{
    use LazilyRefreshDatabase;

    private IChannelRepo $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = app(IChannelRepo::class);
        Storage::fake('public');
    }

    public function test_stream_returns_full_file_when_no_range_header_is_present(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Video message',
        ]);

        $filePath = 'attachments/test_video.mp4';
        Storage::disk('public')->put($filePath, str_repeat('A', 10000)); // 10,000 bytes

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $filePath,
            'name' => 'test_video.mp4',
            'size' => 10000,
            'mime' => 'video/mp4',
            'storage_disk' => 'public',
        ]);

        $response = $this->actingAs($user1)
            ->get(route('attachments.stream', $attachment));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'video/mp4');
        $response->assertHeader('Accept-Ranges', 'bytes');
    }

    public function test_stream_returns_partial_content_for_normal_range(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Video message',
        ]);

        $filePath = 'attachments/test_video.mp4';
        $content = str_repeat('A', 10000);
        Storage::disk('public')->put($filePath, $content);

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $filePath,
            'name' => 'test_video.mp4',
            'size' => 10000,
            'mime' => 'video/mp4',
            'storage_disk' => 'public',
        ]);

        // Request bytes 1000-2000
        $response = $this->actingAs($user1)
            ->get(route('attachments.stream', $attachment), [
                'Range' => 'bytes=1000-2000',
            ]);

        $response->assertStatus(206);
        $response->assertHeader('Content-Type', 'video/mp4');
        $response->assertHeader('Content-Length', '1001');
        $response->assertHeader('Content-Range', 'bytes 1000-2000/10000');
        $response->assertHeader('Accept-Ranges', 'bytes');
    }

    public function test_stream_returns_partial_content_for_open_range(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Video message',
        ]);

        $filePath = 'attachments/test_video.mp4';
        Storage::disk('public')->put($filePath, str_repeat('A', 10000));

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $filePath,
            'name' => 'test_video.mp4',
            'size' => 10000,
            'mime' => 'video/mp4',
            'storage_disk' => 'public',
        ]);

        // Request bytes 5000-
        $response = $this->actingAs($user1)
            ->get(route('attachments.stream', $attachment), [
                'Range' => 'bytes=5000-',
            ]);

        $response->assertStatus(206);
        $response->assertHeader('Content-Length', '5000');
        $response->assertHeader('Content-Range', 'bytes 5000-9999/10000');
    }

    public function test_stream_returns_partial_content_for_suffix_range(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Video message',
        ]);

        $filePath = 'attachments/test_video.mp4';
        Storage::disk('public')->put($filePath, str_repeat('A', 10000));

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $filePath,
            'name' => 'test_video.mp4',
            'size' => 10000,
            'mime' => 'video/mp4',
            'storage_disk' => 'public',
        ]);

        // Request bytes =-1500 (last 1500 bytes, i.e. 8500-9999)
        $response = $this->actingAs($user1)
            ->get(route('attachments.stream', $attachment), [
                'Range' => 'bytes=-1500',
            ]);

        $response->assertStatus(206);
        $response->assertHeader('Content-Length', '1500');
        $response->assertHeader('Content-Range', 'bytes 8500-9999/10000');
    }

    public function test_stream_returns_416_for_out_of_bounds_range(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Video message',
        ]);

        $filePath = 'attachments/test_video.mp4';
        Storage::disk('public')->put($filePath, str_repeat('A', 10000));

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $filePath,
            'name' => 'test_video.mp4',
            'size' => 10000,
            'mime' => 'video/mp4',
            'storage_disk' => 'public',
        ]);

        $response = $this->actingAs($user1)
            ->get(route('attachments.stream', $attachment), [
                'Range' => 'bytes=12000-15000',
            ]);

        $response->assertStatus(416);
        $response->assertHeader('Content-Range', 'bytes */10000');
    }

    public function test_stream_is_unauthorized_if_user_not_in_channel(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $stranger = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Video message',
        ]);

        $filePath = 'attachments/test_video.mp4';
        Storage::disk('public')->put($filePath, str_repeat('A', 10000));

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $filePath,
            'name' => 'test_video.mp4',
            'size' => 10000,
            'mime' => 'video/mp4',
            'storage_disk' => 'public',
        ]);

        $response = $this->actingAs($stranger)
            ->get(route('attachments.stream', $attachment));

        $response->assertForbidden();
    }

    public function test_thumbnail_service_returns_null_gracefully_when_ffmpeg_is_missing(): void
    {
        $service = new VideoThumbnailService;

        $filePath = 'attachments/test_video.mp4';
        Storage::disk('public')->put($filePath, str_repeat('A', 500));

        $result = $service->generate($filePath, 'public');
        $this->assertNull($result);
    }

    public function test_non_mp4_video_and_audio_do_not_generate_thumbnails_or_stream(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Non-MP4 attachments',
        ]);

        // 1. Create a non-mp4 video (e.g. webm)
        $webmPath = 'attachments/test_video.webm';
        Storage::disk('public')->put($webmPath, str_repeat('A', 1000));
        $webmAttachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $webmPath,
            'name' => 'test_video.webm',
            'size' => 1000,
            'mime' => 'video/webm',
            'storage_disk' => 'public',
        ]);

        // 2. Create an audio file (e.g. mp3)
        $mp3Path = 'attachments/test_audio.mp3';
        Storage::disk('public')->put($mp3Path, str_repeat('A', 500));
        $mp3Attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => $mp3Path,
            'name' => 'test_audio.mp3',
            'size' => 500,
            'mime' => 'audio/mpeg',
            'storage_disk' => 'public',
        ]);

        // Check streaming on non-mp4 files returns 403 Forbidden
        $responseWebm = $this->actingAs($user1)
            ->get(route('attachments.stream', $webmAttachment));
        $responseWebm->assertForbidden();

        $responseMp3 = $this->actingAs($user1)
            ->get(route('attachments.stream', $mp3Attachment));
        $responseMp3->assertForbidden();

        // Check buildMessageSnapshot or API resources don't expose stream_url or thumbnail_url
        $resource = new MessageAttachmentResource($webmAttachment);
        $resourceArray = $resource->toArray(request());
        $this->assertNull($resourceArray['stream_url']);
        $this->assertNull($resourceArray['thumbnail_url']);

        $mp3Resource = new MessageAttachmentResource($mp3Attachment);
        $mp3ResourceArray = $mp3Resource->toArray(request());
        $this->assertNull($mp3ResourceArray['stream_url']);
        $this->assertNull($mp3ResourceArray['thumbnail_url']);
    }

    public function test_attachment_uploads_correct_audio_mime_types(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($user1->id, $user2->id);

        Storage::fake('public');

        $file1 = UploadedFile::fake()->create('audio-recording.webm', 200, 'video/webm');
        $file2 = UploadedFile::fake()->create('piano.mp3', 500, 'audio/mpeg');
        $file3 = UploadedFile::fake()->create('audio-recorder.mp4', 300, 'video/mp4');

        $response = $this->actingAs($user1)
            ->postJson(route('channels.messages.store', $channel->id), [
                'content' => 'Message with attachments',
                'attachments' => [$file1, $file2, $file3],
            ]);

        $response->assertCreated();

        // Verify correct MIME types in database
        $this->assertDatabaseHas('message_attachments', [
            'name' => 'audio-recording.webm',
            'mime' => 'audio/webm',
        ]);
        $this->assertDatabaseHas('message_attachments', [
            'name' => 'piano.mp3',
            'mime' => 'audio/mpeg',
        ]);
        $this->assertDatabaseHas('message_attachments', [
            'name' => 'audio-recorder.mp4',
            'mime' => 'audio/mp4',
        ]);
    }
}
