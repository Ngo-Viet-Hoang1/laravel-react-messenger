<?php

namespace Tests\Feature;

use App\Jobs\DeleteChannelJob;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class GroupDeleteEndpointTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_non_owner_cannot_delete_channel(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $channel = Channel::create([
            'type' => 'group',
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $channel->members()->attach([$owner->id, $member->id]);

        $this->actingAs($member)
            ->delete(route('channels.destroy', $channel))
            ->assertForbidden();
    }

    public function test_owner_can_delete_channel_and_job_dispatched(): void
    {
        Bus::fake();

        $owner = User::factory()->create();
        $channel = Channel::create([
            'type' => 'group',
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $channel->members()->attach([$owner->id]);

        $this->actingAs($owner)
            ->delete(route('channels.destroy', $channel))
            ->assertOk();

        Bus::assertDispatched(DeleteChannelJob::class, function (DeleteChannelJob $job) use ($channel) {
            return $job->channelId === $channel->id;
        });
    }

    public function test_admin_can_delete_channel(): void
    {
        Bus::fake();

        $owner = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);
        $channel = Channel::create([
            'type' => 'group',
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $channel->members()->attach([$owner->id]);

        $this->actingAs($admin)
            ->delete(route('channels.destroy', $channel))
            ->assertOk();
    }

    public function test_guest_is_redirected_when_deleting_channel(): void
    {
        $owner = User::factory()->create();
        $channel = Channel::create([
            'type' => 'group',
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $this->delete(route('channels.destroy', $channel))
            ->assertRedirect(route('login'));
    }

    public function test_cannot_delete_direct_channel(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $channel = Channel::findOrCreateDirect($user1->id, $user2->id);

        $this->actingAs($user1)
            ->delete(route('channels.destroy', $channel))
            ->assertForbidden();
    }
}
