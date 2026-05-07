<?php

namespace Tests\Feature;

use App\Events\GroupDeleted;
use App\Jobs\DeleteGroupJob;
use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class GroupDeletedEventTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_event_is_dispatched_for_each_member(): void
    {
        Event::fake([GroupDeleted::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id, $member->id]);

        DeleteGroupJob::dispatchSync($group->id);

        Event::assertDispatched(GroupDeleted::class, function (GroupDeleted $event) use ($group, $owner) {
            return $event->userId === $owner->id
                && $event->groupId === $group->id
                && $event->name === $group->name;
        });

        Event::assertDispatched(GroupDeleted::class, function (GroupDeleted $event) use ($group, $member) {
            return $event->userId === $member->id
                && $event->groupId === $group->id
                && $event->name === $group->name;
        });
    }
}
