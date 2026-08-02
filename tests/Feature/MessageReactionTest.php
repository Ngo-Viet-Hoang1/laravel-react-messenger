<?php

namespace Tests\Feature;

use App\Events\MessageReactionUpdated;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class MessageReactionTest extends TestCase
{
    use LazilyRefreshDatabase;

    private IChannelRepo $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = app(IChannelRepo::class);
    }

    public function test_user_can_add_reaction_to_message(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello!',
        ]);

        Event::fake([MessageReactionUpdated::class]);

        $response = $this->actingAs($receiver)
            ->post(route('messages.reactions.toggle', $message), [
                'emoji' => '👍',
            ]);

        $response->assertOk();
        $response->assertJsonPath('message_id', $message->id);
        $response->assertJsonPath('reactions.0.emoji', '👍');
        $response->assertJsonPath('reactions.0.count', 1);
        $response->assertJsonPath('reactions.0.user_ids.0', $receiver->id);

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $receiver->id,
            'emoji' => '👍',
        ]);

        Event::assertDispatched(MessageReactionUpdated::class);
    }

    public function test_user_can_toggle_off_same_reaction(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello!',
        ]);

        MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $receiver->id,
            'emoji' => '👍',
        ]);

        Event::fake([MessageReactionUpdated::class]);

        $response = $this->actingAs($receiver)
            ->post(route('messages.reactions.toggle', $message), [
                'emoji' => '👍',
            ]);

        $response->assertOk();
        $response->assertJsonPath('reactions', []);

        $this->assertDatabaseMissing('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $receiver->id,
        ]);
    }

    public function test_selecting_different_emoji_updates_existing_reaction(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello!',
        ]);

        MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $receiver->id,
            'emoji' => '👍',
        ]);

        Event::fake([MessageReactionUpdated::class]);

        $response = $this->actingAs($receiver)
            ->post(route('messages.reactions.toggle', $message), [
                'emoji' => '❤️',
            ]);

        $response->assertOk();
        $response->assertJsonPath('reactions.0.emoji', '❤️');
        $response->assertJsonPath('reactions.0.count', 1);

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $receiver->id,
            'emoji' => '❤️',
        ]);
        $this->assertDatabaseMissing('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $receiver->id,
            'emoji' => '👍',
        ]);
    }

    public function test_non_member_cannot_react_to_message(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $outsider = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello!',
        ]);

        $response = $this->actingAs($outsider)
            ->post(route('messages.reactions.toggle', $message), [
                'emoji' => '👍',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseMissing('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $outsider->id,
        ]);
    }

    public function test_reaction_updates_channel_last_message_id(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'First message',
        ]);

        // Channel should have last_message_id set to this message after observer fires
        $channel->refresh();
        $this->assertSame($message->id, $channel->last_message_id);

        Event::fake([MessageReactionUpdated::class]);

        $this->actingAs($receiver)
            ->post(route('messages.reactions.toggle', $message), [
                'emoji' => '🔥',
            ]);

        $channel->refresh();
        $this->assertSame($message->id, $channel->last_message_id);
    }

    public function test_user_can_react_to_own_message(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'My own message',
        ]);

        Event::fake([MessageReactionUpdated::class]);

        $response = $this->actingAs($sender)
            ->post(route('messages.reactions.toggle', $message), [
                'emoji' => '😂',
            ]);

        $response->assertOk();
        $response->assertJsonPath('reactions.0.emoji', '😂');

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $sender->id,
            'emoji' => '😂',
        ]);
    }

    public function test_multiple_users_can_react_to_same_message(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        $channel = Channel::factory()->create(['owner_id' => $user1->id]);
        $channel->members()->attach([$user1->id, $user2->id, $user3->id]);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user1->id,
            'content' => 'Group message',
        ]);

        Event::fake([MessageReactionUpdated::class]);

        // User2 reacts with 👍
        $this->actingAs($user2)
            ->post(route('messages.reactions.toggle', $message), ['emoji' => '👍'])
            ->assertOk();

        // User3 reacts with 👍
        $response = $this->actingAs($user3)
            ->post(route('messages.reactions.toggle', $message), ['emoji' => '👍']);

        $response->assertOk();
        $response->assertJsonPath('reactions.0.emoji', '👍');
        $response->assertJsonPath('reactions.0.count', 2);

        $this->assertDatabaseCount('message_reactions', 2);
    }

    public function test_messages_index_includes_reactions(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $sender->id,
            'content' => 'Hello!',
        ]);

        MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $receiver->id,
            'emoji' => '❤️',
        ]);

        $response = $this->actingAs($sender)
            ->get(route('channels.messages', $channel));

        $response->assertOk();
        $response->assertJsonPath('data.0.reactions.0.emoji', '❤️');
        $response->assertJsonPath('data.0.reactions.0.count', 1);
    }
}
