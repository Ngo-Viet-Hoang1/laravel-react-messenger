<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class UserAdminActionsTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_block_and_unblock_another_user(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'email_verified_at' => now()]);
        $target = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($admin)
            ->patch(route('users.block', $target))
            ->assertRedirect();

        $this->assertNotNull($target->refresh()->blocked_at);

        $this->actingAs($admin)
            ->patch(route('users.unblock', $target))
            ->assertRedirect();

        $this->assertNull($target->refresh()->blocked_at);
    }

    public function test_admin_cannot_block_self(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'email_verified_at' => now()]);

        $response = $this->actingAs($admin)
            ->patch(route('users.block', $admin));

        $response->assertForbidden();

        $this->assertNull($admin->refresh()->blocked_at);
    }

    public function test_admin_can_toggle_user_role(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'email_verified_at' => now()]);
        $target = User::factory()->create(['is_admin' => false, 'email_verified_at' => now()]);

        $this->actingAs($admin)
            ->patch(route('users.promote', $target))
            ->assertRedirect();

        $this->assertTrue($target->refresh()->is_admin);

        $this->actingAs($admin)
            ->patch(route('users.demote', $target))
            ->assertRedirect();

        $this->assertFalse($target->refresh()->is_admin);
    }
}
