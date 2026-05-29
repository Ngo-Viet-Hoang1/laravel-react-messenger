<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'johndoe@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        $jane = User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'janesmith@example.com',
            'password' => bcrypt('password'),
            'is_admin' => false,
        ]);

        $randomUsers = User::factory(10)->create();
        $allUsers = collect([$admin, $jane])->concat($randomUsers);

        for ($i = 0; $i < 5; $i++) {
            $channel = Channel::factory()->create(['owner_id' => $admin->id]);

            // Random subset of users + always include admin
            $members = $allUsers->random(rand(2, 6))->pluck('id')->push($admin->id)->unique()->all();
            $channel->members()->attach($members);
        }

        $dmPairs = collect([[$admin->id, $jane->id]]);

        for ($i = 0; $i < 5; $i++) {
            $pair = $allUsers->random(2)->pluck('id')->sort()->values();
            $dmPairs->push($pair->all());
        }

        foreach ($dmPairs as $pair) {
            Channel::findOrCreateDirect($pair[0], $pair[1]);
        }

        // ── . Seed messages (without triggering Observer) ─────────────
        // WithoutModelEvents prevents Observer from firing during seed
        // We manually update last_message_id after all messages are created
        Message::factory(200)->create();

        // ── . Update last_message_id for each channel ─────────────────
        Channel::all()->each(function (Channel $channel) {
            $lastMsg = Message::where('channel_id', $channel->id)->latest()->first();

            if ($lastMsg) {
                $channel->update(['last_message_id' => $lastMsg->id]);
            }
        });
    }
}
