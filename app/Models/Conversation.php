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

    public static function getConversationsForSideBar(User $user)
    {
        $users = User::getUsersExceptUser($user);
        $group = Group::getGroupsForUser($user);
        return $users->map(function (User $user) {
            return $user->toConversationArray();
        })->concat($group->map(function (Group $group) {
            return $group->toConversationArray();
        }));
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public static function updateConersationWithMessage($userId1, $userId2, $message) 
    {
        $conversation = Conversation::where(function ($query) use($userId1, $userId2) {
            $query->where('user_id1', $userId1)
                ->where('user_id2', $userId2);
        })->orWhere(function ($query) use ($userId1, $userId2) {
            $query->where('user_id1', $userId2)
                ->where('user_id2', $userId1);
        })->first();

        if($conversation) {
            $conversation->update([
                'last_message_id' => $message->id
            ]);
        } else {
            $conversation = Conversation::create([
                'user_id1' => min($userId1, $userId2),
                'user_id2' => max($userId1, $userId2),
                'last_message_id' => $message->id
            ]);
        }
    }
}
