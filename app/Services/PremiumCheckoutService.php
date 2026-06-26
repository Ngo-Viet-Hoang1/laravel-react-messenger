<?php

namespace App\Services;

use App\Models\PremiumPayment;
use App\Models\User;
use App\Services\Payments\PaymentGatewayFactory;
use DomainException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            ->createPremiumOrder($user, $months, (string) Str::uuid());
    }

    public function captureOrder(User $user, string $providerOrderId, string $provider = 'paypal'): PremiumPayment
    {
        $expiredCheckout = false;

        $payment = DB::transaction(function () use ($user, $providerOrderId, $provider, &$expiredCheckout): PremiumPayment {
            $payment = PremiumPayment::query()
                ->where('user_id', $user->id)
                ->where('provider', $provider)
                ->where('provider_order_id', $providerOrderId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($payment->status === PremiumPayment::StatusCompleted) {
                return $payment;
            }

            if ($payment->status === PremiumPayment::StatusCancelled) {
                throw new DomainException('This PayPal checkout has already been cancelled. Please start a new payment.');
            }

            if ($payment->isExpiredPendingCheckout()) {
                $this->paymentGatewayFactory
                    ->make($provider)
                    ->cancelPremiumOrder($payment);

                $expiredCheckout = true;

                return $payment->refresh();
            }

            $requestId = $payment->capture_request_id ?? (string) Str::uuid();

            $capturedPayment = $this->paymentGatewayFactory
                ->make($provider)
                ->capturePremiumOrder($payment, $requestId);

            $this->activatePremiumIfCompleted($user, $capturedPayment);

            return $capturedPayment->refresh();
        });

        if ($expiredCheckout) {
            throw new DomainException('This PayPal checkout expired after 60 minutes. Please start a new payment.');
        }

        return $payment;
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
            DB::transaction(function () use ($payment, &$cancelledCount): void {
                $lockedPayment = PremiumPayment::query()
                    ->whereKey($payment->id)
                    ->lockForUpdate()
                    ->first();

                if (! $lockedPayment || ! $lockedPayment->isExpiredPendingCheckout()) {
                    return;
                }

                $cancelledPayment = $this->paymentGatewayFactory
                    ->make($lockedPayment->provider)
                    ->cancelPremiumOrder($lockedPayment);

                if ($cancelledPayment->status === PremiumPayment::StatusCompleted && $lockedPayment->user) {
                    $this->activatePremiumIfCompleted($lockedPayment->user, $cancelledPayment);

                    return;
                }

                if ($cancelledPayment->status === PremiumPayment::StatusCancelled) {
                    $cancelledCount++;
                }
            });
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
