<?php

namespace App\Jobs;

use App\Events\ChannelDeleted;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class DeleteChannelJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $channelId) {}

    public function handle(): void
    {
        $channel = Channel::with('members:id,name')->find($this->channelId);

        if (! $channel) {
            return;
        }

        $memberIds = $channel->members->pluck('id')->all();
        $memberNames = $channel->members
            ->mapWithKeys(fn (User $member) => [$member->id => $member->name])
            ->all();

        $messageIds = Message::where('channel_id', $channel->id)->pluck('id');

        $attachmentDirs = MessageAttachment::whereIn('message_id', $messageIds)
            ->whereNotNull('path')
            ->get(['path', 'storage_disk'])
            ->groupBy('storage_disk')
            ->map(fn ($items) => $items->map(fn ($a) => dirname((string) $a->path))->unique()->values());

        $channel->update(['last_message_id' => null]);

        MessageAttachment::whereIn('message_id', $messageIds)->delete();
        Message::whereIn('id', $messageIds)->delete();
        foreach ($attachmentDirs as $disk => $dirs) {
            foreach ($dirs as $dir) {
                Storage::disk($disk)->deleteDirectory($dir);
            }
        }

        $channel->members()->detach();
        $channel->delete();

        foreach ($memberIds as $memberId) {
            $channelName = $channel->type === 'direct'
                ? $this->resolveDirectChannelName($memberId, $memberNames)
                : ($channel->name ?? 'Channel');

            ChannelDeleted::dispatch($memberId, $channel->id, $channelName);
        }
    }

    /**
     * @param  array<int, string>  $memberNames
     */
    private function resolveDirectChannelName(int $memberId, array $memberNames): string
    {
        $peerNames = array_values(array_filter(
            $memberNames,
            fn (string $name, int $id): bool => $id !== $memberId,
            ARRAY_FILTER_USE_BOTH,
        ));

        return $peerNames[0] ?? 'Direct Message';
    }
}
