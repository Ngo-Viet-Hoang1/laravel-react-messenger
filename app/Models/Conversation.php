<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class Conversation extends Model
{
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
}
