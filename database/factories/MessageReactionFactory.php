<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MessageReaction>
 */
class MessageReactionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

        return [
            'message_id' => Message::factory(),
            'user_id' => User::factory(),
            'emoji' => fake()->randomElement($emojis),
        ];
    }
}
