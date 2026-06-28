<?php

namespace App\Services;

use App\Jobs\DeleteChannelJob;
use App\Models\Channel;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Database\Eloquent\Collection;

class ChannelService
{
    public function __construct(
        private IChannelRepo $channelRepo
    ) {}

    public function getChannelsForUser(User $user): Collection
    {
        return $this->channelRepo->getChannelsForUser($user);
    }

    public function getMembers(Channel $channel): Collection
    {
        return $this->channelRepo->getMembers($channel);
    }

    public function createChannel(array $data): Channel
    {
        $memberIds = $data['user_ids'];

        return $this->channelRepo->create([
            'type' => 'group',
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_id' => $data['owner_id'],
        ], $memberIds);
    }

    public function findOrCreateDirect(int $authUserId, int $targetUserId): Channel
    {
        return $this->channelRepo->findOrCreateDirect($authUserId, $targetUserId);
    }

    public function updateChannel(Channel $channel, array $data): Channel
    {
        $channel->update([
            'name' => $data['name'] ?? $channel->name,
            'description' => $data['description'] ?? $channel->description,
        ]);

        if (isset($data['user_ids'])) {
            $channel->members()->sync($data['user_ids']);
        }

        return $channel;
    }

    public function addMember(Channel $channel, User $user): void
    {
        $channel->members()->syncWithoutDetaching([$user->id]);
    }

    public function removeMember(Channel $channel, User $user): void
    {
        $channel->members()->detach($user->id);
    }

    public function deleteChannel(Channel $channel): void
    {
        DeleteChannelJob::dispatch($channel->id)->delay(now()->addSeconds(1));
    }

    public function getChannelDetail(Channel $channel): Channel
    {
        return $channel->loadMissing(['members:id,name,avatar_url,is_admin,blocked_at']);
    }

    public function markAsRead(Channel $channel, int $userId, ?int $lastReadMessageId): void
    {
        $this->channelRepo->markAsRead($channel, $userId, $lastReadMessageId);
    }

    /**
     * Get all attachments for a channel, excluding audio.
     *
     * @return Collection<int, MessageAttachment>
     */
    public function getChannelAttachments(Channel $channel): Collection
    {
        return MessageAttachment::whereHas('message', function ($query) use ($channel) {
            $query->where('channel_id', $channel->id);
        })
            ->where('mime', 'not like', 'audio/%')
            ->latest()
            ->get();
    }
}
