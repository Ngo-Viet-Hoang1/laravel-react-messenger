<?php

namespace Tests\Feature;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ChannelShowTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_channel_show_returns_inertia_page(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = Channel::findOrCreateDirect($sender->id, $receiver->id);

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
