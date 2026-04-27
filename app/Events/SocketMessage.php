<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocketMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Message $message)
    {
        //
    }

    public function broadcastWith(): array
    {
        return [
            'message' => new MessageResource($this->message),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $m = $this->message;
        $channels = [];

        if ($m->group_id) {
            $channels[] = new PrivateChannel('message.group.'.$m->group_id);
        } else {
            $userIds = [$m->sender_id, $m->receiver_id];
            sort($userIds);

            $channels[] = new PrivateChannel('message.user.'.$userIds[0].'-'.$userIds[1]);
        }

        return $channels;
    }
}
