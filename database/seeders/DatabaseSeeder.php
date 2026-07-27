<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // 1. Tạo hoặc lấy Admin user (Idempotent firstOrCreate)
        $admin = User::firstOrCreate(
            ['email' => 'johndoe@example.com'],
            [
                'name' => 'John Doe',
                'password' => bcrypt('password'),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Tạo hoặc lấy Jane Smith user (Idempotent firstOrCreate)
        $jane = User::firstOrCreate(
            ['email' => 'janesmith@example.com'],
            [
                'name' => 'Jane Smith',
                'password' => bcrypt('password'),
                'is_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        // Nếu hệ thống đã có kênh chat mẫu rồi thì dừng, tránh tạo lặp lại rác
        if (Channel::count() >= 5) {
            $this->command?->info('Sample channel data already seeded. Skipping...');
            return;
        }

        $randomUsers = User::factory(10)->create();
        $allUsers = collect([$admin, $jane])->concat($randomUsers);

        for ($i = 0; $i < 5; $i++) {
            $channel = Channel::factory()->create(['owner_id' => $admin->id]);

            // Random subset of users + always include admin
            $members = $allUsers->random(rand(2, 6))->pluck('id')->push($admin->id)->unique()->all();
            $channel->members()->syncWithPivotValues($members, ['last_read_message_id' => 0]);
        }

        $dmPairs = collect([[$admin->id, $jane->id]]);

        for ($i = 0; $i < 5; $i++) {
            $pair = $allUsers->random(2)->pluck('id')->sort()->values();
            $dmPairs->push($pair->all());
        }

        $channelRepo = app(IChannelRepo::class);
        foreach ($dmPairs as $pair) {
            $channel = $channelRepo->findOrCreateDirect($pair[0], $pair[1]);
            $channel->members()->syncWithPivotValues($pair, ['last_read_message_id' => 0]);
        }

        // ── . Seed messages per channel (without triggering Observer) ──
        // Each channel gets its own time window so sidebar ordering stays stable.
        $channels = Channel::with('members')->orderBy('id')->get();
        $baseTime = now()->subDays($channels->count());

        foreach ($channels as $offset => $channel) {
            $members = $channel->members->sortBy('id')->values();
            if ($members->isEmpty()) {
                continue;
            }

            $messageCount = $channel->type === 'direct' ? 6 : 8;
            $channelBaseTime = (clone $baseTime)->addDays($offset);

            for ($messageIndex = 0; $messageIndex < $messageCount; $messageIndex++) {
                $sender = $members[$messageIndex % $members->count()];

                Message::create([
                    'channel_id' => $channel->id,
                    'sender_id' => $sender->id,
                    'parent_id' => null,
                    'content' => Str::limit(fake()->realText(120), 120, ''),
                    'created_at' => (clone $channelBaseTime)->addMinutes($messageIndex),
                    'updated_at' => (clone $channelBaseTime)->addMinutes($messageIndex),
                ]);
            }
        }

        // ── . Update last_message_id for each channel ─────────────────
        Channel::all()->each(function (Channel $channel) {
            $lastMsg = Message::where('channel_id', $channel->id)->latest()->first();

            if ($lastMsg) {
                $channel->update(['last_message_id' => $lastMsg->id]);

                $memberIds = $channel->members()->pluck('users.id')->sort()->values()->all();
                $readMemberIds = $channel->type === 'direct'
                    ? [($memberIds[0] ?? 0)]
                    : ($channel->owner_id ? [$channel->owner_id] : []);

                $channel->members()->syncWithoutDetaching(
                    collect($memberIds)->mapWithKeys(
                        fn (int $userId) => [
                            $userId => [
                                'last_read_message_id' => in_array($userId, $readMemberIds, true)
                                    ? $lastMsg->id
                                    : 0,
                            ],
                        ]
                    )->all()
                );
            }
        });
    }
}
