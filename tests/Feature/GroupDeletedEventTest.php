<?php

namespace Tests\Feature;

use App\Events\ChannelDeleted;
use App\Jobs\DeleteChannelJob;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class GroupDeletedEventTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_channel_deleted_event_is_dispatched_for_each_member(): void
    {
        Event::fake([ChannelDeleted::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        $channel = Channel::create([
            'type' => 'group',
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $channel->members()->attach([$owner->id, $member->id]);

        DeleteChannelJob::dispatchSync($channel->id);

        Event::assertDispatched(ChannelDeleted::class, function (ChannelDeleted $event) use ($channel, $owner) {
            return $event->userId === $owner->id
                && $event->channelId === $channel->id
                && $event->name === $channel->name;
        });

        Event::assertDispatched(ChannelDeleted::class, function (ChannelDeleted $event) use ($channel, $member) {
            return $event->userId === $member->id
                && $event->channelId === $channel->id
                && $event->name === $channel->name;
        });
    }
}
