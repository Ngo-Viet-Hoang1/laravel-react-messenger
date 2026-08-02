<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PremiumPaymentResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'provider' => $this->provider,
            'provider_order_id' => $this->provider_order_id,
            'status' => $this->status,
            'months' => $this->months,
            'amount_cents' => $this->amount_cents,
            'currency' => $this->currency,
            'approval_url' => $this->canContinueCheckout() ? $this->approvalUrl() : null,
            'can_continue_payment' => $this->canContinueCheckout(),
            'checkout_expires_at' => $this->checkoutExpiresAt(),
            'captured_at' => $this->captured_at,
            'premium_activated_at' => $this->premium_activated_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
