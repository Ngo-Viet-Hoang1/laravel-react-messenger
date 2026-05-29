<?php

namespace Tests\Feature;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class MessageStoreTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_store_message_uses_channel_route_param(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = Channel::findOrCreateDirect($sender->id, $receiver->id);

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
}
