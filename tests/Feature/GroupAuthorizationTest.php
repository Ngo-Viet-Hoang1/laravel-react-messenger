<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class GroupAuthorizationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_non_owner_cannot_update_group(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id, $member->id]);

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            'user_ids' => [$owner->id, $member->id],
        ];

        $this->actingAs($member)
            ->put(route('groups.update', $group), $payload)
            ->assertForbidden();
    }

    public function test_owner_can_update_group(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id, $member->id]);

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            'user_ids' => [$owner->id, $member->id],
        ];

        $this->actingAs($owner)
            ->put(route('groups.update', $group), $payload)
            ->assertStatus(302);
    }

    public function test_admin_can_update_group(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);

        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id]);

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            'user_ids' => [$admin->id, $owner->id],
        ];

        $this->actingAs($admin)
            ->put(route('groups.update', $group), $payload)
            ->assertStatus(302);
    }

    public function test_update_keeps_owner_in_group(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id, $member->id]);

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            'user_ids' => [$member->id],
        ];

        $this->actingAs($owner)
            ->put(route('groups.update', $group), $payload)
            ->assertStatus(302);

        $this->assertTrue($group->users()->whereKey($owner->id)->exists());
    }
}
