<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\MessageReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MessageReport>
 */
class MessageReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'message_id' => Message::factory(),
            'reported_by' => User::factory(),
            'reason' => fake()->randomElement(['spam', 'harassment', 'hate_speech', 'nsfw', 'other']),
            'note' => fake()->optional()->sentence(),
            'status' => 'pending',
        ];
    }

    public function reviewed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'reviewed',
            'reviewed_by' => User::factory()->state(['is_admin' => true]),
            'reviewed_at' => now(),
        ]);
    }

    public function dismissed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'dismissed',
            'reviewed_by' => User::factory()->state(['is_admin' => true]),
            'reviewed_at' => now(),
        ]);
    }
}
