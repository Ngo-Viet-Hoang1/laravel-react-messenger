<?php

namespace App\Observers;

use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Support\Facades\Storage;

class MessageObserver
{
    public function deleting(Message $message)
    {
        $message->attachments()->each(function ($attachment) {
            if (!$attachment->path) {
                return;
            }

            $dir = dirname((string) $attachment->path);
            Storage::disk('public')->deleteDirectory($dir);
        });

        $message->attachments()->delete();

        if ($message->group_id) {
            $group = Group::where('last_message_id', $message->id)->first();
            if ($group) {
                $lastMessage = Message::where('group_id', $group->id)
                    ->where('id', '!=', $message->id)
                    ->latest()
                    ->first();

                $group->last_message_id = $lastMessage?->id;
                $group->save();
            }
        } else {
            $conversation = Conversation::where('last_message_id', $message->id)->first();

            $lastMessage = Message::where(function ($query) use ($message) {
                $query->where(function ($q) use ($message) {
                    $q->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id);
                })->orWhere(function ($q) use ($message) {
                    $q->where('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                });
            })->where('id', '!=', $message->id)->latest()->first();

            if ($conversation) {
                $conversation->last_message_id = $lastMessage?->id;
                $conversation->save();
            }
        }
    }
}
