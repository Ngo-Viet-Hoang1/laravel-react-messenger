<?php

namespace App\Services;

use App\Models\PremiumPayment;
use App\Models\User;
use App\Services\Payments\PaymentGatewayFactory;
use DomainException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PremiumCheckoutService
{
    public function __construct(
        private PaymentGatewayFactory $paymentGatewayFactory,
    ) {}

    /**
     * @return array{payment: PremiumPayment, approval_url: string|null}
     */
    public function createOrder(User $user, int $months, string $provider = 'paypal'): array
    {
        return $this->paymentGatewayFactory
            ->make($provider)
            ->createPremiumOrder($user, $months);
    }

    public function captureOrder(User $user, string $providerOrderId, string $provider = 'paypal'): PremiumPayment
    {
        $payment = PremiumPayment::query()
            ->where('user_id', $user->id)
            ->where('provider', $provider)
            ->where('provider_order_id', $providerOrderId)
            ->firstOrFail();

        if ($payment->isExpiredPendingCheckout()) {
            $this->paymentGatewayFactory
                ->make($provider)
                ->cancelPremiumOrder($payment);

            throw new DomainException('This PayPal checkout expired after 60 minutes. Please start a new payment.');
        }

        return DB::transaction(function () use ($payment, $user, $provider): PremiumPayment {
            $capturedPayment = $this->paymentGatewayFactory
                ->make($provider)
                ->capturePremiumOrder($payment);

            $this->activatePremiumIfCompleted($user, $capturedPayment);

            return $capturedPayment->refresh();
        });
    }

    public function cancelExpiredPendingOrders(?Carbon $now = null): int
    {
        $expiresBefore = ($now ?? now())->copy()->subMinutes(PremiumPayment::CheckoutTimeoutMinutes);

        $payments = PremiumPayment::query()
            ->whereIn('status', PremiumPayment::pendingStatuses())
            ->where('created_at', '<=', $expiresBefore)
            ->with('user')
            ->get();

        $cancelledCount = 0;

        foreach ($payments as $payment) {
            $cancelledPayment = $this->paymentGatewayFactory
                ->make($payment->provider)
                ->cancelPremiumOrder($payment);

            if ($cancelledPayment->status === PremiumPayment::StatusCompleted && $payment->user) {
                $this->activatePremiumIfCompleted($payment->user, $cancelledPayment);

                continue;
            }

            if ($cancelledPayment->status === PremiumPayment::StatusCancelled) {
                $cancelledCount++;
            }
        }

        return $cancelledCount;
    }

    private function activatePremiumIfCompleted(User $user, PremiumPayment $payment): void
    {
        if ($payment->status !== PremiumPayment::StatusCompleted) {
            return;
        }

        $startsAt = $user->premium_expires_at?->isFuture()
            ? $user->premium_expires_at
            : now();

        $user->forceFill([
            'premium_started_at' => $user->premium_started_at ?? now(),
            'premium_expires_at' => $startsAt->copy()->addMonthsNoOverflow($payment->months),
        ])->save();
    }
}
