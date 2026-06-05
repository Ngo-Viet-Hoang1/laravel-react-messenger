<?php

namespace App\Http\Controllers;

use App\Events\MessageCreated;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    public function index(Channel $channel)
    {
        $isUserInChannel = auth()->user()?->channels()->whereKey($channel->id)->exists();
        abort_unless($isUserInChannel, 403, 'Unauthorized');

        $beforeId = (int) request()->query('before_id', 0);
        $beforeAt = request()->query('before_at');

        $query = Message::where('channel_id', $channel->id)
            ->with(['sender', 'attachments', 'parent.sender', 'parent.attachments']);

        if ($beforeId && $beforeAt) {
            $query->where(function ($q) use ($beforeAt, $beforeId) {
                $q->where('created_at', '<', $beforeAt)
                    ->orWhere(function ($q2) use ($beforeAt, $beforeId) {
                        $q2->where('created_at', $beforeAt)
                            ->where('id', '<', $beforeId);
                    });
            });
        }

        $messages = $query
            ->latest()
            ->orderByDesc('id')
            ->paginate(10);

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, Channel $channel)
    {
        $data = $request->validated();
        $data['sender_id'] = (int) $request->user()->id;
        $data['channel_id'] = $channel->id;
        $files = $data['attachments'] ?? [];
        unset($data['attachments']);

        $message = DB::transaction(function () use ($data, $files) {
            $message = Message::create($data);

            if ($files !== []) {
                foreach ($files as $file) {
                    $directory = 'attachments/'.Str::random(40);
                    Storage::disk('public')->makeDirectory($directory);

                    MessageAttachment::create([
                        'message_id' => $message->id,
                        'path' => $file->store($directory, 'public'),
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'storage_disk' => 'public',
                        'thumbnail_path' => null,
                    ]);
                }
            }

            return $message->load([
                'sender',
                'attachments',
                'parent.sender',
                'parent.attachments',
            ]);
        });

        // Note: MessageObserver::created fires AFTER DB transaction completes
        // and handles last_message_id update + ChannelUpdated broadcast
        DB::afterCommit(function () use ($message) {
            broadcast(new MessageCreated($message))->toOthers();
        });

        return new MessageResource($message);
    }

    public function destroy(Message $message)
    {
        abort_unless($message->sender_id === auth()->id(), 403);

        $newLastMessage = null;

        DB::transaction(function () use ($message, &$newLastMessage) {
            $channelId = $message->channel_id;
            $deletedMessageId = $message->id;

            $message->delete(); // triggers Observer::deleting + Observer::deleted

            // Observer already recomputed last_message_id, fetch updated value
            $channel = Channel::find($channelId);
            if ($channel && (int) $channel->last_message_id !== $deletedMessageId) {
                $newLastMessage = Message::find($channel->last_message_id);
            }
        });

        return response()->json([
            'newLastMessage' => $newLastMessage ? new MessageResource($newLastMessage) : null,
        ]);
    }
}
