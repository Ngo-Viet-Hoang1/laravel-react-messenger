<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }

        DB::table('channel_members')->truncate();
        DB::table('messages')->truncate();
        DB::table('channels')->truncate();
        DB::table('users')->truncate();

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $admin = User::factory()->create([
            'name' => 'Avery Stone',
            'email' => 'avery.stone@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        $jane = User::factory()->create([
            'name' => 'Maya Tran',
            'email' => 'maya.tran@example.com',
            'password' => bcrypt('password'),
            'is_admin' => false,
        ]);

        $randomUsers = User::factory(12)->create();
        $allUsers = collect([$admin, $jane])->concat($randomUsers);

        $groupNames = [
            'Design Studio',
            'Product Launch',
            'Support Crew',
            'Operations Hub',
            'Weekend Plans',
        ];

        foreach ($groupNames as $groupName) {
            $channel = Channel::factory()->create([
                'name' => $groupName,
                'description' => fake()->sentence(),
                'owner_id' => $admin->id,
            ]);

            $members = $allUsers
                ->random(rand(4, 7))
                ->pluck('id')
                ->push($admin->id)
                ->push($jane->id)
                ->unique()
                ->values()
                ->all();

            $channel->members()->attach($members);
        }

        $dmPairs = collect([
            [$admin->id, $jane->id],
            [$admin->id, $randomUsers[0]->id],
            [$admin->id, $randomUsers[1]->id],
            [$jane->id, $randomUsers[2]->id],
            [$randomUsers[3]->id, $randomUsers[4]->id],
        ]);

        $channelRepo = app(IChannelRepo::class);
        foreach ($dmPairs as $pair) {
            $channelRepo->findOrCreateDirect($pair[0], $pair[1]);
        }

        Channel::query()
            ->with('members')
            ->get()
            ->each(function (Channel $channel): void {
                $memberIds = $channel->members->pluck('id')->all();
                $messageCount = fake()->numberBetween(8, 24);

                for ($i = 0; $i < $messageCount; $i++) {
                    $senderId = fake()->randomElement($memberIds);

                    Message::factory()->create([
                        'channel_id' => $channel->id,
                        'sender_id' => $senderId,
                        'content' => fake()->sentence(fake()->numberBetween(4, 14)),
                        'created_at' => now()->subDays(fake()->numberBetween(0, 45))->subMinutes($i),
                    ]);
                }

                $lastMessage = Message::where('channel_id', $channel->id)
                    ->orderByDesc('id')
                    ->first();

                if ($lastMessage !== null) {
                    $channel->update([
                        'last_message_id' => $lastMessage->id,
                    ]);
                }

                $channel->members->each(function (User $member) use ($channel): void {
                    $lastReadMessage = Message::where('channel_id', $channel->id)
                        ->where('id', '<=', $channel->last_message_id)
                        ->where('sender_id', '!=', $member->id)
                        ->inRandomOrder()
                        ->first();

                    $channel->members()->updateExistingPivot($member->id, [
                        'last_read_message_id' => $lastReadMessage?->id,
                    ]);
                });
            });

        $firstChannel = Channel::query()->first();
        if ($firstChannel !== null) {
            $firstChannel->markAsReadFor($admin);
        }
    }
}
