<?php

namespace Tests\Feature;

use App\Http\Resources\ChannelResource;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ChannelUnreadCountTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_channel_resource_includes_unread_count_for_current_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $channel = Channel::findOrCreateDirect($user->id, $otherUser->id);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $user->id,
            'content' => 'Own message',
        ]);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $otherUser->id,
            'content' => 'Unread message 1',
        ]);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $otherUser->id,
            'content' => 'Unread message 2',
        ]);

        $loadedChannel = Channel::getChannelsForUser($user)->firstWhere('id', $channel->id);
        $resource = (new ChannelResource($loadedChannel))->resolve(request());

        $this->assertSame(2, $resource['unread_count']);
    }

    public function test_mark_channel_as_read_resets_unread_count(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $channel = Channel::findOrCreateDirect($user->id, $otherUser->id);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $otherUser->id,
            'content' => 'Unread message',
        ]);

        $this->assertSame(
            1,
            (int) Channel::getChannelsForUser($user)->firstWhere('id', $channel->id)->unread_count,
        );

        $response = $this->actingAs($user)
            ->patch(route('channels.read', $channel), [
                'last_read_message_id' => $channel->last_message_id,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('last_read_message_id', Message::where('channel_id', $channel->id)->max('id'));

        $this->assertSame(
            0,
            (int) Channel::getChannelsForUser($user)->firstWhere('id', $channel->id)->unread_count,
        );
    }

    public function test_mark_channel_as_read_persists_explicit_last_read_message_id(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $channel = Channel::findOrCreateDirect($user->id, $otherUser->id);

        $firstMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $otherUser->id,
            'content' => 'Unread message 1',
        ]);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $otherUser->id,
            'content' => 'Unread message 2',
        ]);

        $this->actingAs($user)
            ->patch(route('channels.read', $channel), [
                'last_read_message_id' => $firstMessage->id,
            ])
            ->assertOk()
            ->assertJsonPath('last_read_message_id', $firstMessage->id);

        $loadedChannel = Channel::getChannelsForUser($user)->firstWhere('id', $channel->id);

        $this->assertSame(1, (int) $loadedChannel->unread_count);
    }

    public function test_show_channel_marks_it_as_read_before_rendering(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $channel = Channel::findOrCreateDirect($user->id, $otherUser->id);

        Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $otherUser->id,
            'content' => 'Unread message',
        ]);

        $this->actingAs($user)
            ->get(route('channels.show', $channel))
            ->assertOk();

        $loadedChannel = Channel::getChannelsForUser($user)->firstWhere('id', $channel->id);

        $this->assertSame(0, (int) $loadedChannel->unread_count);
        $this->assertSame(Message::where('channel_id', $channel->id)->max('id'), $loadedChannel->last_message_id);
    }

    public function test_non_member_cannot_mark_channel_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $outsider = User::factory()->create();
        $channel = Channel::findOrCreateDirect($user->id, $otherUser->id);

        $this->actingAs($outsider)
            ->patch(route('channels.read', $channel))
            ->assertForbidden();
    }
}
