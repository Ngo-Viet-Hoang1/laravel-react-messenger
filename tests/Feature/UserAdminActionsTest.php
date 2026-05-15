<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAdminActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_block_and_unblock_another_user(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $target = User::factory()->create();

        $blockResponse = $this
            ->actingAs($admin)
            ->patch(route('users.block', $target));

        $blockResponse
            ->assertOk()
            ->assertJson(['message' => "User {$target->name} has been blocked."]);

        $this->assertNotNull($target->refresh()->blocked_at);

        $unblockResponse = $this
            ->actingAs($admin)
            ->patch(route('users.unblock', $target));

        $unblockResponse
            ->assertOk()
            ->assertJson(['message' => "User {$target->name} account has been unblocked."]);

        $this->assertNull($target->refresh()->blocked_at);
    }

    public function test_admin_cannot_block_self(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this
            ->actingAs($admin)
            ->patch(route('users.block', $admin));

        $response
            ->assertStatus(403)
            ->assertJson(['message' => 'You cannot block your own account.']);

        $this->assertNull($admin->refresh()->blocked_at);
    }

    public function test_admin_can_toggle_user_role(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $target = User::factory()->create(['is_admin' => false]);

        $promoteResponse = $this
            ->actingAs($admin)
            ->patch(route('users.promote', $target));

        $promoteResponse
            ->assertOk()
            ->assertJson(['message' => "User {$target->name} has been promoted to admin."]);

        $this->assertTrue($target->refresh()->is_admin);

        $demoteResponse = $this
            ->actingAs($admin)
            ->patch(route('users.demote', $target));

        $demoteResponse
            ->assertOk()
            ->assertJson(['message' => "User {$target->name} has been demoted to a regular user."]);

        $this->assertFalse($target->refresh()->is_admin);
    }
}
