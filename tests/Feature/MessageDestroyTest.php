<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageDestroyTest extends TestCase
{
    use RefreshDatabase;

    public function test_destroy_message_returns_previous_message_and_updates_conversation(): void
    {
        $sender = User::factory()->create(['email_verified_at' => now()]);
        $receiver = User::factory()->create(['email_verified_at' => now()]);

        $olderMessage = Message::factory()->create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'group_id' => null,
            'conversation_id' => null,
        ]);

        Conversation::updateConversationWithMessage($sender->id, $receiver->id, $olderMessage);

        $latestMessage = Message::factory()->create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'group_id' => null,
            'conversation_id' => null,
        ]);

        Conversation::updateConversationWithMessage($sender->id, $receiver->id, $latestMessage);

        $response = $this->actingAs($sender)->delete(route('message.destroy', $latestMessage->id));

        $response->assertOk();
        $response->assertJson([
            'prevMessage' => [
                'id' => $olderMessage->id,
            ],
        ]);

        $this->assertDatabaseMissing('messages', ['id' => $latestMessage->id]);
        $this->assertDatabaseHas('conversations', ['last_message_id' => $olderMessage->id]);
    }
}
