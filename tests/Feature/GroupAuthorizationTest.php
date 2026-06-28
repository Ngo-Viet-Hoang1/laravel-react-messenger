<?php

namespace Tests\Feature;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class GroupAuthorizationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_non_owner_cannot_update_channel(): void
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

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            'user_ids' => [$owner->id, $member->id],
        ];

        $this->actingAs($member)
            ->put(route('channels.update', $channel), $payload)
            ->assertForbidden();
    }

    public function test_owner_can_update_channel(): void
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

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            'user_ids' => [$owner->id, $member->id],
        ];

        $this->actingAs($owner)
            ->put(route('channels.update', $channel), $payload)
            ->assertStatus(302);
    }

    public function test_admin_can_update_channel(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);

        $channel = Channel::create([
            'type' => 'group',
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $channel->members()->attach([$owner->id]);

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            'user_ids' => [$admin->id, $owner->id],
        ];

        $this->actingAs($admin)
            ->put(route('channels.update', $channel), $payload)
            ->assertStatus(302);
    }

    public function test_update_keeps_owner_in_channel(): void
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

        $payload = [
            'name' => 'Team Beta',
            'description' => 'Updated',
            // Exclude owner intentionally — backend should re-add them
            'user_ids' => [$member->id],
        ];

        $this->actingAs($owner)
            ->put(route('channels.update', $channel), $payload)
            ->assertStatus(302);

        $this->assertTrue($channel->members()->whereKey($owner->id)->exists());
    }
}
