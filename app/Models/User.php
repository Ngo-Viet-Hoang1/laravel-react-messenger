<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'avatar',
        'name',
        'email',
        'avatar_url',
        'email_verified_at',
        'password',
        'is_admin',
        'blocked_at',
    ];

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
        ];
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_user');
    }

    public function getUsersExceptUser(User $exceptUser)
    {
        $userId = $exceptUser->id;
        $query = User::select(['user.*', 'messages.message as last_messge', 'messages.created_at as last_message_date'])
            ->where('user.id', '!=', $userId)
            ->when(!$exceptUser->is_admin, function ($query) {
                $query->whereNull('users.blocked_at');
            })->leftJoin('conversations', function ($join) use ($userId) {
                $join->on('conversations.user_id1', '=', 'users.id')
                    ->where('conversations.user_id2', $userId)
                    ->orWhere(function ($query) {
                        $query->on('conversations.user_id2', '=', 'users.id')
                            ->where('conversations.user_id1', Auth::id());
                    });
            });
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'user_id1')
            ->orWhere('user_id2', $this->id);
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }
}
