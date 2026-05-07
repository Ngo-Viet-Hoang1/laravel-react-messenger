<?php

namespace Tests\Feature;

use App\Jobs\DeleteGroupJob;
use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class GroupDeleteEndpointTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_non_owner_cannot_delete_group(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id, $member->id]);

        $this->actingAs($member)
            ->delete(route('groups.destroy', $group))
            ->assertForbidden();
    }

    public function test_owner_can_delete_group_and_job_dispatched(): void
    {
        Bus::fake();

        $owner = User::factory()->create();
        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id]);

        $this->actingAs($owner)
            ->delete(route('groups.destroy', $group))
            ->assertOk();

        Bus::assertDispatched(DeleteGroupJob::class, function (DeleteGroupJob $job) use ($group) {
            return $job->groupId === $group->id;
        });
    }

    public function test_admin_can_delete_group(): void
    {
        Bus::fake();

        $owner = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);
        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id]);

        $this->actingAs($admin)
            ->delete(route('groups.destroy', $group))
            ->assertOk();
    }

    public function test_guest_is_redirected_when_deleting_group(): void
    {
        $owner = User::factory()->create();
        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $this->delete(route('groups.destroy', $group))
            ->assertRedirect(route('login'));
    }
}
