<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $senderId = $this->faker->randomElement([0, 1]);
        if ($senderId === 0) {
            $senderId = $this->faker->randomElement(User::where('id', '!=', 1)->pluck('id')->toArray());
            $receiverId = 1;
        } else {
            $receiverId = $this->faker->randomElement(User::pluck('id')->toArray());
        }

        $groupId = null;
        if ($this->faker->boolean(50)) {
            $groupId = $this->faker->randomElement(Group::pluck('id')->toArray());

            $group = Group::find($groupId);
            $senderId = $this->faker->randomElement($group->users()->pluck('users.id')->toArray());
            $receiverId = null;
        }

        return [
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'group_id' => $groupId,
            'message' => $this->faker->realText(200),
            'conversation_id' => null,
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
