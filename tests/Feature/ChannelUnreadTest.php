<?php

namespace Tests\Feature;

use App\Http\Resources\ChannelResource;
use App\Models\Message;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ChannelUnreadTest extends TestCase
{
    use LazilyRefreshDatabase;

    private IChannelRepo $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = app(IChannelRepo::class);
    }

    public function test_channel_list_includes_unread_count_from_last_read_message_id(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'First unread',
        ]);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Second unread',
        ]);

        $channels = ChannelResource::collection(
            $this->repo->getChannelsForUser($receiver)
        )->resolve(request());

        $this->assertSame(2, $channels[0]['unread_count']);
        $this->assertNull($channels[0]['last_read_message_id']);
    }

    public function test_mark_as_read_updates_pivot_and_returns_last_read_message_id(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $firstMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'First unread',
        ]);

        $secondMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Second unread',
        ]);

        $this->actingAs($receiver)
            ->post(route('channels.read', $channel))
            ->assertOk()
            ->assertJsonPath('channel_id', $channel->id)
            ->assertJsonPath('last_read_message_id', $secondMessage->id);

        $pivot = $channel->members()
            ->whereKey($receiver->id)
            ->first()
            ?->pivot;

        $this->assertSame($secondMessage->id, $pivot?->last_read_message_id);
        $this->assertNotSame($firstMessage->id, $pivot?->last_read_message_id);
    }
}
