<?php

namespace App\Models;

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
        'is_e2ee_enabled',
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
            'is_e2ee_enabled' => 'boolean',
        ];
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'channel_members')
            ->withPivot('last_read_message_id')
            ->withTimestamps();
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
}
