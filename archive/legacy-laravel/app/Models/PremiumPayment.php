<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['user_id', 'provider', 'provider_order_id', 'create_request_id', 'capture_request_id', 'status', 'months', 'amount_cents', 'currency', 'payload', 'captured_at', 'premium_activated_at'])]
class PremiumPayment extends Model
{
    public const StatusCreated = 'CREATED';

    public const StatusProcessing = 'PROCESSING';

    public const StatusCompleted = 'COMPLETED';

    public const StatusCancelled = 'CANCELLED';

    public const StatusFailed = 'FAILED';

    public const CheckoutTimeoutHours = 3;

    /**
     * @return list<string>
     */
    public static function pendingStatuses(): array
    {
        return [
            self::StatusCreated,
            self::StatusProcessing,
            'PAYER_ACTION_REQUIRED',
            'APPROVED',
        ];
    }

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'captured_at' => 'datetime',
            'premium_activated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(PremiumPaymentEvent::class);
    }

    public function approvalUrl(): ?string
    {
        $approvalLink = collect($this->payload['links'] ?? [])->firstWhere('rel', 'approve');

        return is_array($approvalLink) ? ($approvalLink['href'] ?? null) : null;
    }

    public function checkoutExpiresAt(): ?Carbon
    {
        return $this->created_at?->copy()->addHours(self::CheckoutTimeoutHours);
    }

    public function canContinueCheckout(): bool
    {
        return in_array($this->status, self::pendingStatuses(), true)
            && $this->approvalUrl() !== null
            && ! $this->isExpiredPendingCheckout();
    }

    public function isExpiredPendingCheckout(): bool
    {
        return in_array($this->status, self::pendingStatuses(), true)
            && $this->created_at !== null
            && $this->created_at->lte(now()->subHours(self::CheckoutTimeoutHours));
    }
}
