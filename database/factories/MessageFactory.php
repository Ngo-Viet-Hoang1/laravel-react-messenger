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
        $channel = Channel::with('members')->inRandomOrder()->first();
        $sender = $channel?->members->isNotEmpty()
            ? $channel->members->random()
            : null;

        return [
            'channel_id' => $channel?->id,
            'sender_id' => $sender?->id,
            'parent_id' => null,
            'content' => $this->faker->realText(
                $this->faker->numberBetween(10, 100)
            ),
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
