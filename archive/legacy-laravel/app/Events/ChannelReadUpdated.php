<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChannelReadUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $channelId,
        public int $userId,
        public ?int $lastReadMessageId,
    ) {}

    public function broadcastWith(): array
    {
        return [
            'channel_id' => $this->channelId,
            'user_id' => $this->userId,
            'last_read_message_id' => $this->lastReadMessageId,
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->userId),
        ];
    }
}
