<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    protected $fillable = ['message_id', 'name', 'path', 'mime', 'size'];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
