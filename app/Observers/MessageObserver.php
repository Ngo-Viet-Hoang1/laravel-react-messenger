<?php

namespace App\Observers;

use App\Models\Channel;
use App\Models\Message;
use Illuminate\Support\Facades\Storage;

class MessageObserver
{
    /**
     * Fired AFTER message is inserted.
     * Updates channel.last_message_id using conditional atomic update
     * to handle concurrent inserts without race condition overwrite.
     */
    public function created(Message $message): void
    {
        Channel::whereKey($message->channel_id)
            ->where(function ($query) use ($message) {
                $query->whereNull('last_message_id')
                    ->orWhere('last_message_id', '<', $message->id);
            })
            ->update(['last_message_id' => $message->id]);
    }

    /**
     * Fired BEFORE message is deleted.
     * Cleans up attachment files from storage.
     */
    public function deleting(Message $message): void
    {
        $message->attachments()->each(function ($attachment) {
            if (!$attachment->path) {
                return;
            }

            $disk = $attachment->storage_disk ?? 'public';
            $dir = dirname((string) $attachment->path);
            Storage::disk($disk)->deleteDirectory($dir);
        });

        $message->attachments()->delete();
    }

    /**
     * Fired AFTER message is deleted.
     * Recomputes last_message_id for the channel only when the deleted message
     * WAS the last message (avoid unnecessary queries).
     */
    public function deleted(Message $message): void
    {
        $channel = Channel::find($message->channel_id);

        if (!$channel) {
            return;
        }

        if ((int) $channel->last_message_id !== (int) $message->id) {
            return;
        }

        $newLastMessage = Message::where('channel_id', $message->channel_id)
            ->latest()
            ->first();

        $channel->update(['last_message_id' => $newLastMessage?->id]);
    }
}
