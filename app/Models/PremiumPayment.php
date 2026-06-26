<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'provider', 'provider_order_id', 'create_request_id', 'capture_request_id', 'status', 'months', 'amount_cents', 'currency', 'payload', 'captured_at'])]
class PremiumPayment extends Model
{
    public const StatusCreated = 'CREATED';

    public const StatusCompleted = 'COMPLETED';

    public const StatusCancelled = 'CANCELLED';

    public const CheckoutTimeoutMinutes = 60;

    /**
     * @return list<string>
     */
    public static function pendingStatuses(): array
    {
        return [
            self::StatusCreated,
            'PAYER_ACTION_REQUIRED',
            'APPROVED',
        ];
    }

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'captured_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpiredPendingCheckout(): bool
    {
        return in_array($this->status, self::pendingStatuses(), true)
            && $this->created_at !== null
            && $this->created_at->lte(now()->subMinutes(self::CheckoutTimeoutMinutes));
    }
}
