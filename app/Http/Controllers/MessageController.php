<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    public function byUser(User $user)
    {
        $selectedUser = $this->resolveSelectedUserConversation($user);

        $messages = $this->directMessageQuery(auth()->id(), $user->id)
            ->with(['sender', 'receiver', 'attachments'])
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $selectedUser->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    public function byGroup(Group $group)
    {
        $this->abortIfUserCannotAccessGroup($group->id);

        $messages = Message::query()
            ->where('group_id', $group->id)
            ->with(['sender', 'receiver', 'attachments'])
            ->latest()
            ->paginate(10);

        $group->load(['users', 'lastMessage']);
        $group->setAttribute('last_message', $group->lastMessage?->message);
        $group->setAttribute('last_message_date', $group->lastMessage?->created_at?->toISOString());

        return inertia('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    public function loadOlder(Message $message)
    {
        $isGroupChat = (bool) $message->group_id;

        if ($isGroupChat) {
            $this->abortIfUserCannotAccessGroup((int) $message->group_id);

            $olderMessages = Message::query()
                ->where('group_id', $message->group_id)
                ->where('created_at', '<', $message->created_at)
                ->with(['sender', 'receiver', 'attachments'])
                ->latest()
                ->paginate(10);
        } else {
            $this->abortIfUserCannotAccessDirectMessage($message);

            $olderMessages = $this->directMessageQuery((int) $message->sender_id, (int) $message->receiver_id)
                ->where('created_at', '<', $message->created_at)
                ->with(['sender', 'receiver', 'attachments'])
                ->latest()
                ->paginate(10);
        }

        return MessageResource::collection($olderMessages);
    }

    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $senderId = (int) $request->user()->id;
        $data['sender_id'] = $senderId;
        $receiverId = isset($data['receiver_id']) ? (int) $data['receiver_id'] : null;
        $groupId = isset($data['group_id']) ? (int) $data['group_id'] : null;
        $files = $data['attachments'] ?? [];
        unset($data['attachments']);

        $message = DB::transaction(function () use ($data, $files, $receiverId, $groupId, $senderId) {
            $message = Message::create($data);

            if ($files !== []) {
                foreach ($files as $file) {
                    $directory = 'attachments/' . Str::random(40);
                    Storage::disk('public')->makeDirectory($directory);

                    MessageAttachment::create([
                        'message_id' => $message->id,
                        'path' => $file->store($directory, 'public'),
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                    ]);
                }
            }

            if ($receiverId !== null) {
                Conversation::updateConversationWithMessage($senderId, $receiverId, $message);
            }

            if ($groupId !== null) {
                Group::updateGroupWithMessage($groupId, $message);
            }

            return $message->load(['sender', 'receiver', 'attachments']);
        });

        broadcast(new SocketMessage($message))->toOthers();

        return new MessageResource($message);
    }

    public function destroy(Message $message)
    {
        if ($message->sender_id !== auth()->id()) {
            abort(403);
        }

        $newLastMessage = null;

        DB::transaction(function () use ($message, &$newLastMessage) {
            $message->delete();

            if ($message->group_id) {
                $group = Group::find($message->group_id);

                if ($group) {
                    $newLastMessage = Message::where('group_id', $group->id)
                        ->latest()
                        ->first();

                    $group->update(['last_message_id' => $newLastMessage?->id]);
                }
            } else {
                $newLastMessage = Message::where(function ($q) use ($message) {
                    $q->where([
                        ['sender_id', $message->sender_id],
                        ['receiver_id', $message->receiver_id],
                    ])->orWhere([
                                ['sender_id', $message->receiver_id],
                                ['receiver_id', $message->sender_id],
                            ]);
                })->latest()->first();

                Conversation::where(function ($q) use ($message) {
                    $q->where('user_id1', $message->sender_id)
                        ->where('user_id2', $message->receiver_id);
                })->orWhere(function ($q) use ($message) {
                    $q->where('user_id1', $message->receiver_id)
                        ->where('user_id2', $message->sender_id);
                })->update(['last_message_id' => $newLastMessage?->id]);
            }
        });

        return response()->json([
            'newLastMessage' => $newLastMessage ? new MessageResource($newLastMessage) : null,
        ]);
    }

    private function abortIfUserCannotAccessGroup(int $groupId): void
    {
        $user = auth()->user();
        abort_unless($user && $user->groups()->whereKey($groupId)->exists(), 403, 'Unauthorized');
    }

    private function abortIfUserCannotAccessDirectMessage(Message $message): void
    {
        $userId = auth()->id();
        abort_unless($userId === $message->sender_id || $userId === $message->receiver_id, 403, 'Unauthorized');
    }

    private function directMessageQuery(int $firstUserId, int $secondUserId): Builder
    {
        return Message::query()->where(function (Builder $query) use ($firstUserId, $secondUserId) {
            $query->where(function (Builder $subQuery) use ($firstUserId, $secondUserId) {
                $subQuery
                    ->where('sender_id', $firstUserId)
                    ->where('receiver_id', $secondUserId);
            })->orWhere(function (Builder $subQuery) use ($firstUserId, $secondUserId) {
                $subQuery
                    ->where('sender_id', $secondUserId)
                    ->where('receiver_id', $firstUserId);
            });
        });
    }

    private function resolveSelectedUserConversation(User $user): User
    {
        $authUserId = (int) auth()->id();

        $conversation = Conversation::query()
            ->where(function (Builder $query) use ($authUserId, $user) {
                $query
                    ->where('user_id1', $authUserId)
                    ->where('user_id2', $user->id);
            })
            ->orWhere(function (Builder $query) use ($authUserId, $user) {
                $query
                    ->where('user_id1', $user->id)
                    ->where('user_id2', $authUserId);
            })
            ->with(['lastMessage:id,message,created_at'])
            ->first();

        $user->setAttribute('last_message', $conversation?->lastMessage?->message);
        $user->setAttribute('last_message_date', $conversation?->lastMessage?->created_at?->toISOString());

        return $user;
    }
}
