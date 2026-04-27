<?php

namespace Tests\Feature;

use App\Events\SocketMessage;
use App\Models\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Tests\TestCase;

class SocketMessageBroadcastTest extends TestCase
{
    public function test_direct_message_broadcasts_on_sorted_private_user_channel(): void
    {
        $message = new Message([
            'sender_id' => 9,
            'receiver_id' => 3,
            'message' => 'Hello',
        ]);

        $channels = (new SocketMessage($message))->broadcastOn();

        $this->assertCount(1, $channels);
        $this->assertEquals(new PrivateChannel('message.user.3-9'), $channels[0]);
    }

    public function test_group_message_broadcasts_on_group_private_channel(): void
    {
        $message = new Message([
            'sender_id' => 9,
            'group_id' => 12,
            'message' => 'Hello group',
        ]);

        $channels = (new SocketMessage($message))->broadcastOn();

        $this->assertCount(1, $channels);
        $this->assertEquals(new PrivateChannel('message.group.12'), $channels[0]);
    }
}
