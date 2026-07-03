<?php

namespace Tests\Feature;

use App\Events\MessageDeleted;
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
}
