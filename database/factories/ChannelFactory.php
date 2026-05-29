<?php

namespace Database\Factories;

use App\Models\Channel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Channel>
 */
class ChannelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type' => 'group',
            'direct_key' => null,
            'name' => $this->faker->company(),
            'description' => $this->faker->optional()->paragraph(),
            'owner_id' => null,
            'last_message_id' => null,
        ];
    }

    public function direct(): static
    {
        return $this->state([
            'type' => 'direct',
            'name' => null,
            'description' => null,
            'owner_id' => null,
        ]);
    }
}
