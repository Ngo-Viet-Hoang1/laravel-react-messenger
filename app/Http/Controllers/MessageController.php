<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Events\SocketMessageDeleted;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    //
    public function byUser(User $user)
    {
        $message = Message::where('sender_id', Auth::id())
            ->where('receiver_id', $user->id)
            ->orWhere('sender_id', $user->id)
            ->where('receiver_id', Auth::id())
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $user->toConversationArray(),
            'messages' => MessageResource::collection($message),
        ]);
    }

    public function byGroup(Group $group)
    {
        $message = Message::where('group_id', $group->id)
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($message),
        ]);
    }

    public function loadOlder(Message $message)
    {
        if ($message->group_id) {
            $messages = Message::where('created_at', '<', $message->created_at)
                ->where('group_id', $message->group_id)
                ->latest()
                ->paginate(10);
        } else {
            $messages = Message::where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                ->latest()
                ->paginate(10);
        }

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = Auth::id();

        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;

        $files = $data['attachments'] ?? null;

        $message = Message::create($data);

        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/'.Str::random(32);
                Storage::makeDirectory($directory);

                MessageAttachment::create([
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),
                ]);
            }
            $message->load('attachments');
        }

        if ($receiverId) {
            Conversation::updateConversationWithMessage($receiverId, Auth::id(), $message);
        }

        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message);
        }

        SocketMessage::dispatch($message);

        return new MessageResource($message);
    }

    public function destroy(Message $message)
    {
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $prevMessage = null;

        if ($message->group_id) {
            $prevMessage = Message::query()
                ->where('group_id', $message->group_id)
                ->whereKeyNot($message->id)
                ->latest()
                ->first();

            Group::query()
                ->where('id', $message->group_id)
                ->update(['last_message_id' => $prevMessage?->id]);
        } else {
            $prevMessage = Message::query()
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                ->whereKeyNot($message->id)
                ->latest()
                ->first();

            Conversation::query()
                ->where(function ($query) use ($message) {
                    $query->where('user_id1', $message->sender_id)
                        ->where('user_id2', $message->receiver_id);
                })
                ->orWhere(function ($query) use ($message) {
                    $query->where('user_id1', $message->receiver_id)
                        ->where('user_id2', $message->sender_id);
                })
                ->update(['last_message_id' => $prevMessage?->id]);
        }

        $message->delete();

        SocketMessageDeleted::dispatch($message, $prevMessage);

        return response()->json([
            'prevMessage' => $prevMessage ? new MessageResource($prevMessage) : null,
        ]);
    }

    public static function updateGroupWithMessage($groupId, $message)
    {
        return Group::updateOrCreate(
            ['id' => $groupId],
            ['last_message_id' => $message->id]
        );
    }
}
