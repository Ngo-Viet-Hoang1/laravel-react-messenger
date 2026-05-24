<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Group;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\MessageAttachment;
use App\Events\SocketMessage;
use App\Http\Resources\MessageResource;
use App\Http\Requests\StoreMessageRequest;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;


class MessageController extends Controller
{
    public function byUser(User $user)
    {
       $message = Message::with(['sender', 'attachments'])
            ->where('sender_id', auth()->id())->where('receiver_id', $user->id)
            ->orWhere('sender_id', $user->id)->where('receiver_id', auth()->id())
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $user -> toConversationArray(),
            'messages' => MessageResource::collection($message),
        ]);
    }
    public function byGroup(Group $group)
    {
        $messages = Message::with(['sender', 'attachments'])
            ->where('group_id', $group->id)
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $group -> toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }
    public function loadOlder(Message $message)
    {
        if ($message->group_id) {
            $messages = Message::with(['sender', 'attachments'])
                ->where('created_at', '<', $message->created_at)
                ->where('group_id', $message->group_id)
                ->latest()
                ->paginate(10);
        } else {
            $messages = Message::with(['sender', 'attachments'])
                ->where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)->where('receiver_id',$message->sender_id);
                })
                ->latest()
            ->paginate(10);
        }
        return MessageResource::collection($messages);
    }
    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();
        $receiver_id = $data['receiver_id'] ?? null;
        $group_id = $data['group_id'] ?? null;

        $files = $data['attachments'] ?? [];

        $message = Message::create($data);
        $attachments = [];
        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/' . Str::random(32);
                Storage::disk('public')->makeDirectory($directory);

                $attachments[] = MessageAttachment::create([
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mine' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),
                ]);
            }

            $message->setRelation('attachments', collect($attachments));
        }
        if ($receiver_id) {
          Conversation::updateConversationWithMessage($receiver_id, auth()->id(), $message);
        } if ($group_id) {
           Group::updateGroupWithMessage($group_id, $message);
        }

        SocketMessage::dispatch($message->loadMissing('sender', 'attachments'));

        return new MessageResource($message->loadMissing('sender', 'attachments'));
    }
    public function destroy(Message $message)
    {
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $group = null;
        $conversation = null;

        if($message->group_id){
            $group = Group::where('last_message_id', $message->id)->first();
        } else {
            $conversation = Conversation::where('last_message_id', $message->id)->first();
        }

        $message->delete();

        if($group){
            $group = Group::find($group->id);
            $lastMessage = $group->lastMessage;
        } else if($conversation) {
            $conversation = Conversation::find($conversation->id);
            $lastMessage = $conversation->lastMessage;
        }

        return response()->json(['message'=>$lastMessage ? new MessageResource($lastMessage) : null]);
    }
}
