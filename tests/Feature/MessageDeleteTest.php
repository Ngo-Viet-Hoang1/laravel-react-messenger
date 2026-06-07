<?php

namespace Tests\Feature;

use App\Events\MessageDeleted;
use App\Events\MessagesCleared;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class MessageDeleteTest extends TestCase
{
    use LazilyRefreshDatabase;

    private IChannelRepo $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = app(IChannelRepo::class);
    }

    public function test_deleting_last_message_returns_previous_and_updates_channel(): void
    {
        Event::fake([MessageDeleted::class]);

        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $firstMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'First message',
        ]);
        $channel->update(['last_message_id' => $firstMessage->id]);

        $secondMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Second message',
        ]);
        $channel->update(['last_message_id' => $secondMessage->id]);

        $response = $this->actingAs($sender)
            ->delete(route('messages.destroy', $secondMessage));

        $response->assertOk();
        $response->assertJsonPath('message.id', $secondMessage->id);
        $response->assertJsonPath('message.deleted_at', fn ($value) => $value !== null);
        $response->assertJsonPath('newLastMessage.id', $firstMessage->id);

        $this->assertModelMissing($secondMessage);

        $channel->refresh();
        $this->assertSame($firstMessage->id, $channel->last_message_id);

        Event::assertDispatched(MessageDeleted::class);
    }

    public function test_non_sender_cannot_delete_message(): void
    {
        $sender = User::factory()->create();
        $other = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $other->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello',
        ]);

        $this->actingAs($other)
            ->delete(route('messages.destroy', $message))
            ->assertForbidden();

        $this->assertModelExists($message);
    }

    public function test_guest_cannot_delete_message(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello',
        ]);

        $this->delete(route('messages.destroy', $message))
            ->assertRedirect(route('login'));
    }

    public function test_deleting_all_messages_is_allowed_for_direct_channels_only(): void
    {
        Event::fake([MessagesCleared::class]);

        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'First',
        ]);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $receiver->id,
            'content' => 'Second',
        ]);

        $response = $this->actingAs($sender)
            ->delete(route('channels.messages.destroy-all', $channel));

        $response->assertOk();
        $response->assertJsonPath('channel_id', $channel->id);
        $response->assertJsonPath('deleted_count', 2);

        $this->assertDatabaseCount('messages', 0);

        Event::assertDispatched(MessagesCleared::class);
    }

    public function test_group_channels_cannot_be_cleared(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $channel = Channel::factory()->create([
            'type' => 'group',
            'owner_id' => $owner->id,
            'name' => 'Group',
        ]);

        $channel->members()->attach([$owner->id, $member->id]);

        $this->actingAs($owner)
            ->delete(route('channels.messages.destroy-all', $channel))
            ->assertForbidden();
    }
}
