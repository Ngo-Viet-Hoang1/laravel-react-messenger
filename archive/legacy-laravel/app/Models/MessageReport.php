<?php

namespace App\Models;

use Database\Factories\MessageReportFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessageReport extends Model
{
    /** @use HasFactory<MessageReportFactory> */
    use HasFactory;

    protected $fillable = [
        'message_id',
        'reported_by',
        'reason',
        'note',
        'status',
        'reviewed_by',
        'reviewed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function siblingReports(): HasMany
    {
        return $this->hasMany(MessageReport::class, 'message_id', 'message_id');
    }

    public static function pendingCount(): int
    {
        return self::where('status', 'pending')
            ->distinct('message_id')
            ->count('message_id');
    }
}
