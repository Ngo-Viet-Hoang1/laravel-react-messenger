<?php

namespace Tests\Feature;

use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use App\Services\VideoThumbnailService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
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
}
