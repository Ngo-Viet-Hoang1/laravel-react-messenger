<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMessageRequest;
use Illuminate\Http\Request;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\User;
use App\Models\Group;
use App\Models\Conversation;
use App\Models\MessageAttachment;
use App\Events\SocketMessage;
use Illuminate\Support\Facades\Storage;
use Str;

class MessageController extends Controller
{
    public function byUser(User $user)
    {
        $message = Message::where('sender_id', auth()->id())
            ->where('receiver_id', $user->id)
            ->orWhere('sender_id', $user->id)
            ->where('receiver_id', auth()->id())
            ->with(['sender', 'attachments'])
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $user -> toConversationArray(),
            'messages' => MessageResource::collection($message)
        ]);
    }

    public function byGroup(Group $group)
    {
        $message = Message::where('group_id', $group->id)
            ->with(['sender', 'attachments'])
            ->latest()
            ->paginate(50);

        return inertia('Home', [
            'selectedConversation' => $group -> toConversationArray(),
            'messages' => MessageResource::collection($message)
        ]);
    }

    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();
        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;

        $files = $data['attachments'] ?? [];
        $messageText = trim((string) ($data['message'] ?? ''));
        if ($messageText === '' && count($files) === 0) {
            return response()->json(['message' => 'Message or attachment required.'], 422);
        }
        $data['message'] = $messageText;

        $message = Message::create($data);

        $attachments = [];
        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/' . Str::random(32);
                Storage::makeDirectory($directory);

                $model = [
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),
                ];
                $attachments[] = MessageAttachment::create($model);
            }
            $message->setRelation('attachments', collect($attachments));
        }


        if ($receiverId) {
            Conversation::updateConversationWithMessage($receiverId, auth()->id(), $message->id);
        }
        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message->id);
        }

        $message->load(['sender', 'attachments']);
        SocketMessage::dispatch($message);

        return new MessageResource($message);

    }

    public function destroy(Message $message)
    {
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message->delete();

        return response('', 204);
    }

    public function loadOlder(Message $message)
    {
        if ($message->group_id) {
            $message = Message::where('created_at', '<', $message->created_at)
                ->where('group_id', $message->group_id)
                ->with(['sender', 'attachments'])
                ->latest()
                ->paginate(10);
        } else {
            $message = Message::where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
            ->with(['sender', 'attachments'])
            ->latest()
            ->paginate(10);
        }
        return MessageResource::collection($message);
    }
}
