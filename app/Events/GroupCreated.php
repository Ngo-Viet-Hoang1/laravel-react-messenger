<?php

namespace App\Events;

use App\Models\Group;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Group $group)
    {
    }

    public function broadcastWith(): array
    {
        return [
            'group' => $this->group->toConversationArray(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'group.created';
    }

    public function broadcastOn(): array
    {
        return $this->group->users()
            ->pluck('users.id')
            ->map(fn ($id) => new PrivateChannel('user.'.$id))
            ->all();
    }
}
