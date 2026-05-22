<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'owner_id', 'last_message_id'];

    public function users(){
        return $this->belongsToMany(User::class, 'group_user');
    }

    public function messages(){
        return $this->hasMany(Message::class);
    }

    public function owner(){
        return $this->belongsTo(User::class);
    }

    public function lastMessage(){
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public static function getGroupsForUser(User $user){
        $query = self::select(['groups.*', 'messages.message as last_message', 'messages.created_at as last_message_date'])
            ->join('group_user', 'group_user.group_id', '=', 'groups.id')
            ->leftJoin('messages', 'groups.last_message_id', '=', 'messages.id')
            ->where('group_user.user_id', $user->id)
            ->orderBy('messages.created_at', 'desc')
            ->orderBy('groups.name');

        return $query->get();
    }

    public function toConversationArray(){
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_group' => true,
            'is_user' => false,
            'owner_id' => $this->owner_id,
            'users' => $this->users()->pluck('users.id'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date ? ($this->last_message_date.'UTC') : null,
        ];
    }

    public static function updateGroupWithMessage($groupId, $messageId){
        return self::updateOrCreate(
            ['id' => $groupId],
            ['last_message_id' => $messageId]
        );
    }
}