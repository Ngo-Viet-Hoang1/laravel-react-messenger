<?php

namespace App\Repositories\Eloquent;

use App\Models\Channel;
use App\Models\Message;
use App\Repositories\Interfaces\IMessageRepo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MessageRepo implements IMessageRepo
{
    public function getByChannel(Channel $channel, int $perPage): LengthAwarePaginator
    {
        return Message::where('channel_id', $channel->id)
            ->with([
                'sender:id,name,avatar_url',
                'attachments',
                'parent.sender:id,name,avatar_url',
            ])
            ->latest()
            ->paginate($perPage);
    }
}
