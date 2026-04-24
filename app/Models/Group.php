<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Group extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'owner_id', 'last_message_id'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'group_users');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public static function getGroupsForUser(User $user)
    {
        $query = self::select(['groups.*', 'messages.message as last_message', 'messages.created_at as last_message_date'])
            ->join('group_users', 'groups.id', '=', 'group_users.group_id')
            ->leftJoin('messages', 'groups.last_message_id', '=', 'messages.id')
            ->with(['users:id,name,avatar_url,is_admin,blocked_at'])
            ->where('group_users.user_id', $user->id)
            ->orderBy('messages.created_at', 'desc')
            ->orderBy('groups.name');

        return $query->get();
    }

    public function toConversationArray()
    {
        $lastMessage = $this->last_message ?? $this->lastMessage?->message;
        $lastMessageDate = $this->last_message_date ?? $this->lastMessage?->created_at;
        if ($lastMessageDate !== null) {
            $lastMessageDate = Carbon::parse($lastMessageDate)->toISOString();
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'is_group' => true,
            'is_user' => false,
            'owner_id' => $this->owner_id,
            'users' => $this->relationLoaded('users')
                ? $this->users->map(fn(User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar_url' => $user->avatar_url,
                    'is_admin' => (bool) $user->is_admin,
                    'blocked_at' => $user->blocked_at,
                ])->values()->all()
                : [],
            'user_ids' => $this->relationLoaded('users')
                ? $this->users->pluck('id')->values()->all()
                : [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'last_message' => $lastMessage,
            'last_message_date' => $lastMessageDate,
        ];
    }

    public static function updateGroupWithMessage(int $groupId, Message $message): void
    {
        self::query()
            ->whereKey($groupId)
            ->update(['last_message_id' => $message->id]);
    }
}
