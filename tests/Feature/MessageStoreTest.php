<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MessageStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_direct_message_returns_ok_and_updates_conversation(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $response = $this->actingAs($sender)->post(route('message.store'), [
            'message' => 'Hello from test',
            'receiver_id' => $receiver->id,
        ]);

        $response->assertCreated();

        $message = Message::query()->firstOrFail();
        $conversation = Conversation::query()->firstOrFail();

        $this->assertSame($sender->id, $message->sender_id);
        $this->assertSame($receiver->id, $message->receiver_id);
        $this->assertSame('Hello from test', $message->message);

        $this->assertSame(min($sender->id, $receiver->id), $conversation->user_id1);
        $this->assertSame(max($sender->id, $receiver->id), $conversation->user_id2);
        $this->assertSame($message->id, $conversation->last_message_id);
    }

    public function test_store_message_with_attachments_saves_files_and_returns_with_attachments(): void
    {
        Storage::fake('public');

        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->actingAs($sender)->post(route('message.store'), [
            'message' => 'Check out this image',
            'receiver_id' => $receiver->id,
            'attachments' => [$file],
        ]);

        $response->assertCreated();

        $message = Message::query()->firstOrFail();
        $this->assertSame('Check out this image', $message->message);
        $this->assertCount(1, $message->attachments);

        $attachment = $message->attachments->first();
        $this->assertSame('test.jpg', $attachment->name);
        $this->assertNotNull($attachment->path);
        $this->assertNotNull($attachment->mime);
        $this->assertGreaterThan(0, $attachment->size);

        $responseData = $response->json();
        $this->assertCount(1, $responseData['attachments']);
        $this->assertArrayHasKey('url', $responseData['attachments'][0]);
    }
}
