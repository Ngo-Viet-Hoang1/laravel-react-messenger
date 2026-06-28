<?php

namespace Tests\Feature;

use App\Models\Message;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ChannelShowTest extends TestCase
{
    use LazilyRefreshDatabase;
    private IChannelRepo $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = app(IChannelRepo::class);
    }

    public function test_channel_show_returns_inertia_page(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello from channel show',
        ]);

        $response = $this->actingAs($sender)
            ->get(route('channels.show', $channel));

        $response->assertOk();
    }
}
