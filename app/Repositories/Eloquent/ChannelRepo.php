<?php

namespace App\Repositories\Eloquent;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Database\Eloquent\Collection;

class ChannelRepo implements IChannelRepo
{
    public function getChannelsForUser(User $user): Collection
    {
        return Channel::select([
            'channels.*',
            'channel_members.last_read_message_id as last_read_message_id',
            'messages.content as last_message',
            'messages.created_at as last_message_date',
        ])
            ->join('channel_members', 'channels.id', '=', 'channel_members.channel_id')
            ->leftJoin('messages', 'channels.last_message_id', '=', 'messages.id')
            ->with(['members:id,name,avatar_url,is_admin,blocked_at'])
            ->where('channel_members.user_id', $user->id)
            ->selectSub(
                Message::selectRaw('count(*)')
                    ->whereColumn('messages.channel_id', 'channels.id')
                    ->whereRaw('messages.id > COALESCE(channel_members.last_read_message_id, 0)')
                    ->where('messages.sender_id', '!=', $user->id),
                'unread_count',
            )
            ->orderByRaw('messages.created_at IS NULL, messages.created_at DESC')
            ->orderBy('channels.name')
            ->get();
    }

    public function getMembers(Channel $channel): Collection
    {
        return $channel->members()->select('id', 'name', 'avatar_url', 'is_admin', 'blocked_at')->get();
    }

    public function create(array $data, array $memberIds): Channel
    {
        $channel = Channel::create($data);
        $channel->members()->attach($memberIds, ['last_read_message_id' => null]);

        return $channel;
    }

    public function findOrCreateDirect(int $userId1, int $userId2): Channel
    {
        $directKey = implode(':', [min($userId1, $userId2), max($userId1, $userId2)]);

        $channel = Channel::firstOrCreate(
            ['direct_key' => $directKey],
            [
                'type' => 'direct',
                'name' => null,
                'description' => null,
                'owner_id' => null,
            ]
        );

        // Ensure both users are members (in case the channel was just created or one user was removed from an existing channel)
        $channel->members()->syncWithoutDetaching([$userId1, $userId2]);

        return $channel;
    }

    public function markAsRead(Channel $channel, int $userId, ?int $lastReadMessageId): void
    {
        $channel->members()->updateExistingPivot($userId, [
            'last_read_message_id' => $lastReadMessageId,
        ]);
    }
}
