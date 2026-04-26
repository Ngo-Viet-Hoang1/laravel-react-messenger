<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
