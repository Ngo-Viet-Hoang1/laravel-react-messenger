<?php

namespace Tests\Feature;

use App\Models\Message;
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
}
