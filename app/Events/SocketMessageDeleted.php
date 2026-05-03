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

class SocketMessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message, public ?Message $prevMessage) {}

    public function broadcastWith(): array
    {
        return [
            'message' => new MessageResource($this->message),
            'prevMessage' => $this->prevMessage ? new MessageResource($this->prevMessage) : null,
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.deleted';
    }

    /**
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
