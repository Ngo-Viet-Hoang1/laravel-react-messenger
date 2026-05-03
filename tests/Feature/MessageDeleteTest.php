<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class MessageDeleteTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_deleting_last_message_returns_previous_and_updates_conversation(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $firstMessage = Message::create([
            'message' => 'First message',
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
        ]);
        Conversation::updateConversationWithMessage(
            $sender->id,
            $receiver->id,
            $firstMessage,
        );

        $secondMessage = Message::create([
            'message' => 'Second message',
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
        ]);
        Conversation::updateConversationWithMessage(
            $sender->id,
            $receiver->id,
            $secondMessage,
        );

        $response = $this->actingAs($sender)
            ->delete(route('message.destroy', $secondMessage));

        $response->assertOk();
        $response->assertJsonPath('newLastMessage.id', $firstMessage->id);

        $this->assertModelMissing($secondMessage);

        $conversation = Conversation::firstOrFail();
        $this->assertSame($firstMessage->id, $conversation->last_message_id);
    }
}
