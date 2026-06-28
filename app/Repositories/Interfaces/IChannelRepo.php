<?php

namespace App\Repositories\Interfaces;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface IChannelRepo
{
    public function getChannelsForUser(User $user): Collection;

    public function getMembers(Channel $channel): Collection;

    public function create(array $data, array $memberIds): Channel;

    public function findOrCreateDirect(int $userId1, int $userId2): Channel;

    public function markAsRead(Channel $channel, int $userId, ?int $lastReadMessageId): void;
}
