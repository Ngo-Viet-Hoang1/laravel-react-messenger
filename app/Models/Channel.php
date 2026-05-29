<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Channel extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'direct_key',
        'name',
        'description',
        'owner_id',
        'last_message_id',
    ];

    protected function casts(): array
    {
        return [
            'last_message_id' => 'integer',
        ];
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'channel_members');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Lightweight relation for accessing last message.
     *
     * WARNING:
     * - No foreign key constraint
     * - Avoid eager loading in complex queries (may cause circular joins)
     * - Prefer join-based queries (see getChannelsForUser)
     */
    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function scopeDirect($query)
    {
        return $query->where('type', 'direct');
    }

    public function scopeGroup($query)
    {
        return $query->where('type', 'group');
    }

    public static function getChannelsForUser(User $user): Collection
    {
        return self::select([
            'channels.*',
            'messages.content as last_message',
            'messages.created_at as last_message_date',
        ])
            ->join('channel_members', 'channels.id', '=', 'channel_members.channel_id')
            ->leftJoin('messages', 'channels.last_message_id', '=', 'messages.id')
            ->with(['members:id,name,avatar_url,is_admin,blocked_at'])
            ->where('channel_members.user_id', $user->id)
            ->orderBy('messages.created_at', 'desc')
            ->orderBy('channels.name')
            ->get();
    }

    public static function findOrCreateDirect(int $userId1, int $userId2): self
    {
        $directKey = implode(':', [min($userId1, $userId2), max($userId1, $userId2)]);

        $channel = self::firstOrCreate(
            ['direct_key' => $directKey],
            [
                'type' => 'direct',
                'name' => null,
                'description' => null,
                'owner_id' => null,
            ]
        );

        // Ensure both users are members (in case the channel was just created or one user was removed from an existing channel)
        $channel->members()->syncWithoutDetaching([$userId1, $userId2]);

        return $channel;
    }
}
