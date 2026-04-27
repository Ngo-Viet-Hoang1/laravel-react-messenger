<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BroadcastingAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_presence_online_channel_authenticates_with_member_data(): void
    {
        $user = User::factory()->create();

        $response = $this->withoutMiddleware(VerifyCsrfToken::class)
            ->actingAs($user)
            ->postJson('/broadcasting/auth', [
                'socket_id' => '123.456',
                'channel_name' => 'presence-online',
            ]);

        $response->assertOk();
        $this->assertNotEmpty($response->getContent());
    }

    public function test_private_message_channel_authenticates_for_participating_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $response = $this->withoutMiddleware(VerifyCsrfToken::class)
            ->actingAs($user)
            ->postJson('/broadcasting/auth', [
                'socket_id' => '123.456',
                'channel_name' => 'private-message.user.'.$user->id.'-'.$otherUser->id,
            ]);

        $response->assertOk();
        $this->assertNotEmpty($response->getContent());
    }

    public function test_group_channel_rejects_non_member_user(): void
    {
        $user = User::factory()->create();
        $owner = User::factory()->create();
        $group = Group::factory()->create(['owner_id' => $owner->id]);

        $response = $this->withoutMiddleware(VerifyCsrfToken::class)
            ->actingAs($user)
            ->postJson('/broadcasting/auth', [
                'socket_id' => '123.456',
                'channel_name' => 'private-message.group.'.$group->id,
            ]);

        $response->assertForbidden();
    }
}
