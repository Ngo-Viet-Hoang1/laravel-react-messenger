<?php

namespace Tests\Feature;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class PruneExpiredFreeUserMessagesTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_it_prunes_old_messages_from_free_users_only(): void
    {
        $freeUser = User::factory()->create();
        $premiumUser = User::factory()->create([
            'premium_started_at' => now()->subMonth(),
            'premium_expires_at' => now()->addMonth(),
        ]);

        $channel = Channel::factory()->create();
        $channel->members()->attach([$freeUser->id, $premiumUser->id]);

        $expiredFreeMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $freeUser->id,
            'content' => 'old free message',
        ]);
        $expiredFreeMessage->forceFill([
            'created_at' => now()->subDays(91),
            'updated_at' => now()->subDays(91),
        ])->save();

        $recentFreeMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $freeUser->id,
            'content' => 'recent free message',
        ]);
        $recentFreeMessage->forceFill([
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(10),
        ])->save();

        $oldPremiumMessage = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $premiumUser->id,
            'content' => 'old premium message',
        ]);
        $oldPremiumMessage->forceFill([
            'created_at' => now()->subDays(120),
            'updated_at' => now()->subDays(120),
        ])->save();

        $this->artisan('messages:prune-expired-free-users')
            ->assertSuccessful();

        $this->assertModelMissing($expiredFreeMessage);
        $this->assertModelExists($recentFreeMessage);
        $this->assertModelExists($oldPremiumMessage);
    }

    public function test_expired_premium_users_follow_free_retention(): void
    {
        $expiredPremiumUser = User::factory()->create([
            'premium_started_at' => now()->subMonths(2),
            'premium_expires_at' => now()->subDay(),
        ]);

        $channel = Channel::factory()->create();
        $channel->members()->attach($expiredPremiumUser->id);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $expiredPremiumUser->id,
            'content' => 'expired premium message',
        ]);
        $message->forceFill([
            'created_at' => now()->subDays(91),
            'updated_at' => now()->subDays(91),
        ])->save();

        $this->artisan('messages:prune-expired-free-users')
            ->assertSuccessful();

        $this->assertModelMissing($message);
    }
}
