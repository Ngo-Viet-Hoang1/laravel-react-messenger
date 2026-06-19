<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class UserSearchTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_search_without_query_returns_all_unblocked_users(): void
    {
        $me = User::factory()->create(['email_verified_at' => now()]);
        $other = User::factory()->create(['name' => 'Alice', 'email_verified_at' => now()]);
        $blocked = User::factory()->create(['name' => 'Blocked Bob', 'blocked_at' => now(), 'email_verified_at' => now()]);

        $response = $this->actingAs($me)
            ->getJson(route('users.index'));

        $response->assertOk();

        $ids = collect($response->json())->pluck('id')->all();

        $this->assertContains($other->id, $ids);
        $this->assertNotContains($me->id, $ids, 'Current user should be excluded');
        $this->assertNotContains($blocked->id, $ids, 'Blocked users should be excluded by default');
    }

    public function test_search_with_empty_q_does_not_apply_like_filter(): void
    {
        $me = User::factory()->create(['email_verified_at' => now()]);
        User::factory()->count(3)->create(['email_verified_at' => now()]);

        // Empty q should return all users (no LIKE %% filter)
        $response = $this->actingAs($me)
            ->getJson(route('users.index', ['q' => '']));

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_search_filters_by_name(): void
    {
        $me = User::factory()->create(['email_verified_at' => now()]);
        $alice = User::factory()->create(['name' => 'Alice Smith', 'email_verified_at' => now()]);
        User::factory()->create(['name' => 'Bob Jones', 'email_verified_at' => now()]);

        $response = $this->actingAs($me)
            ->getJson(route('users.index', ['q' => 'Alice']));

        $response->assertOk();

        $ids = collect($response->json())->pluck('id')->all();
        $this->assertContains($alice->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_search_filters_by_email(): void
    {
        $me = User::factory()->create(['email_verified_at' => now()]);
        $target = User::factory()->create(['email' => 'unique-test@example.org', 'email_verified_at' => now()]);
        User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($me)
            ->getJson(route('users.index', ['q' => 'unique-test']));

        $response->assertOk();

        $ids = collect($response->json())->pluck('id')->all();
        $this->assertContains($target->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_search_results_are_limited_to_15(): void
    {
        $me = User::factory()->create(['email_verified_at' => now()]);
        User::factory()->count(20)->create(['name' => 'TestUser', 'email_verified_at' => now()]);

        $response = $this->actingAs($me)
            ->getJson(route('users.index', ['q' => 'TestUser']));

        $response->assertOk();
        $this->assertCount(15, $response->json());
    }

    public function test_admin_can_include_blocked_users(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'email_verified_at' => now()]);
        $blocked = User::factory()->create(['name' => 'Blocked User', 'blocked_at' => now(), 'email_verified_at' => now()]);

        $response = $this->actingAs($admin)
            ->getJson(route('users.index', ['include_blocked' => true]));

        $response->assertOk();

        $ids = collect($response->json())->pluck('id')->all();
        $this->assertContains($blocked->id, $ids);
    }

    public function test_non_admin_cannot_include_blocked_users(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $blocked = User::factory()->create(['name' => 'Blocked User', 'blocked_at' => now(), 'email_verified_at' => now()]);

        $response = $this->actingAs($user)
            ->getJson(route('users.index', ['include_blocked' => true]));

        $response->assertOk();

        $ids = collect($response->json())->pluck('id')->all();
        $this->assertNotContains($blocked->id, $ids, 'Non-admin should not see blocked users');
    }
}
