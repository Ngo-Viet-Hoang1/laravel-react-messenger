<?php

namespace Tests\Feature;

use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class MessageStoreTest extends TestCase
{
    use LazilyRefreshDatabase;

    private IChannelRepo $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = app(IChannelRepo::class);
    }

    public function test_store_message_uses_channel_route_param(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $response = $this->actingAs($sender)
            ->post(route('channels.messages.store', $channel), [
                'content' => 'Hello from nested route',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('channel_id', $channel->id);

        $message = Message::query()
            ->where('channel_id', $channel->id)
            ->where('sender_id', $sender->id)
            ->where('content', 'Hello from nested route')
            ->first();

        $this->assertNotNull($message);
        $this->assertModelExists($message);
    }

    public function test_store_message_supports_reply_parent_id_within_same_channel(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $parentMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $receiver->id,
            'content' => 'Parent message',
        ]);

        $response = $this->actingAs($sender)
            ->post(route('channels.messages.store', $channel), [
                'content' => 'Reply message',
                'parent_id' => $parentMessage->id,
            ]);

        $response->assertCreated();
        $response->assertJsonPath('parent_id', $parentMessage->id);

        $message = Message::query()
            ->where('channel_id', $channel->id)
            ->where('sender_id', $sender->id)
            ->where('content', 'Reply message')
            ->first();

        $this->assertNotNull($message);
        $this->assertSame($parentMessage->id, $message->parent_id);
    }

    public function test_channel_messages_include_parent_attachments_for_reply_previews(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $parentMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $receiver->id,
            'content' => null,
        ]);

        MessageAttachment::create([
            'message_id' => $parentMessage->id,
            'path' => 'attachments/test/photo.jpg',
            'name' => 'photo.jpg',
            'size' => 1234,
            'mime' => 'image/jpeg',
            'storage_disk' => 'local',
        ]);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'parent_id' => $parentMessage->id,
            'content' => 'Reply message',
        ]);

        $response = $this->actingAs($sender)
            ->get(route('channels.messages', $channel));

        $response->assertOk();
        $response->assertJsonPath('data.0.parent.attachments.0.name', 'photo.jpg');
    }
}
