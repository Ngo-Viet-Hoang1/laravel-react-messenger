<?php

namespace Database\Factories;

use App\Models\Channel;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    public function definition(): array
    {
        static $index = 0;

        $channels = Channel::with(['members' => fn ($query) => $query->orderBy('users.id')])
            ->orderBy('id')
            ->get();

        $channel = $channels->isNotEmpty()
            ? $channels[$index % $channels->count()]
            : null;

        $sender = $channel?->members->first();
        $createdAt = now()->addMinutes($index);
        $index++;

        return [
            'channel_id' => $channel?->id,
            'sender_id' => $sender?->id,
            'parent_id' => null,
            'content' => $this->faker->realText(
                $this->faker->numberBetween(10, 100)
            ),
            'created_at' => $createdAt,
        ];
    }
}
