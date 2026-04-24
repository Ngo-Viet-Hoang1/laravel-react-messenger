<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = ['user_id1', 'user_id2', 'last_message_id'];

    protected static function booted(): void
    {
        static::saving(function (Conversation $conversation): void {
            if ((int) $conversation->user_id1 === (int) $conversation->user_id2) {
                throw new InvalidArgumentException('A conversation requires two different users.');
            }

            if ((int) $conversation->user_id1 > (int) $conversation->user_id2) {
                [$conversation->user_id1, $conversation->user_id2] = [$conversation->user_id2, $conversation->user_id1];
            }
        });
    }

    public function user1()
    {
        return $this->belongsTo(User::class, 'user_id1');
    }

    public function user2()
    {
        return $this->belongsTo(User::class, 'user_id2');
    }

    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public static function getConversationsForSidebar(User $user)
    {
        $users = User::getUsersExceptUser($user);
        $groups = Group::getGroupsForUser($user);

        return $users->map(function (User $user) {
            return $user->toConversationArray();
        })->concat($groups->map(function (Group $group) {
            return $group->toConversationArray();
        }))->filter()->values();
    }

    public static function updateConversationWithMessage(int $userId1, int $userId2, Message $message): void
    {
        $conversation = self::where(function ($query) use ($userId1, $userId2) {
            $query->where('user_id1', $userId1)->where('user_id2', $userId2);
        })->orWhere(function ($query) use ($userId1, $userId2) {
            $query->where('user_id1', $userId2)->where('user_id2', $userId1);
        })->first();

        if ($conversation) {
            $conversation->update(['last_message_id' => $message->id]);
        } else {
            self::create([
                'user_id1' => $userId1,
                'user_id2' => $userId2,
                'last_message_id' => $message->id,
            ]);
        }
    }
}
