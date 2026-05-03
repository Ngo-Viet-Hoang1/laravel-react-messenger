<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

#[Fillable(['name', 'email', 'avatar_url', 'email_verified_at', 'password', 'is_admin', 'blocked_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'blocked_at' => 'datetime',
        ];
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_users');
    }

    public function conversations()
    {
        return Conversation::where(function ($query) {
            $query->where('user_id1', $this->id)
                ->orWhere('user_id2', $this->id);
        });
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public static function getUsersExceptUser(User $user)
    {
        $userId = $user->id;
        $query = User::select(['users.*', 'messages.message as last_message', 'messages.created_at as last_message_date'])
            ->where('users.id', '!=', $userId)
            ->when(! $user->is_admin, function ($query) {
                $query->whereNull('users.blocked_at');
            })
            ->leftJoin('conversations', function ($join) use ($userId) {
                $join->on(function ($query) use ($userId) {
                    $query->where('conversations.user_id1', $userId)
                        ->whereColumn('conversations.user_id2', 'users.id');
                })->orOn(function ($query) use ($userId) {
                    $query->where('conversations.user_id2', $userId)
                        ->whereColumn('conversations.user_id1', 'users.id');
                });
            })
            ->leftJoin('messages', 'messages.id', '=', 'conversations.last_message_id')
            ->orderByRaw('users.blocked_at IS NULL DESC') // Show unblocked users first
            ->orderBy('messages.created_at', 'DESC')
            ->orderBy('users.name', 'ASC');

        return $query->get();
    }

    public function toConversationArray()
    {
        $lastMessageDate = $this->last_message_date;
        if ($lastMessageDate !== null) {
            $lastMessageDate = Carbon::parse($lastMessageDate)->toISOString();
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_user' => true,
            'is_group' => false,
            'is_admin' => (bool) $this->is_admin,
            'avatar_url' => $this->avatar_url ? Storage::url($this->avatar_url) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'blocked_at' => $this->blocked_at,
            'last_message' => $this->last_message,
            'last_message_date' => $lastMessageDate,
        ];
    }
}
