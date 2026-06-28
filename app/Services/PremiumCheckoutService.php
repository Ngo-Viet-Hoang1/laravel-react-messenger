<?php

namespace App\Services;

use App\Models\PremiumPayment;
use App\Models\PremiumPaymentEvent;
use App\Models\User;
use App\Services\Payments\PaymentGatewayFactory;
use DomainException;
use Illuminate\Http\Client\RequestException;
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
        return DB::transaction(function () use ($user, $months, $provider): array {
            $lockedUser = User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $pendingPayment = $this->findReusablePendingPayment($lockedUser, $months, $provider);

            if ($pendingPayment) {
                $this->recordPaymentEvent($pendingPayment, 'checkout_reused');

                return [
                    'payment' => $pendingPayment,
                    'approval_url' => $pendingPayment->approvalUrl(),
                ];
            }

            $checkout = $this->paymentGatewayFactory
                ->make($provider)
                ->createPremiumOrder($lockedUser, $months, (string) Str::uuid());

            $this->recordPaymentEvent($checkout['payment'], 'checkout_created', [
                'approval_url' => $checkout['approval_url'],
            ]);

            return $checkout;
        });
    }

    public function captureOrder(User $user, string $providerOrderId, string $provider = 'paypal'): PremiumPayment
    {
        $expiredCheckout = false;
        $captureFailureReason = null;

        $payment = DB::transaction(function () use ($user, $providerOrderId, $provider, &$expiredCheckout, &$captureFailureReason): PremiumPayment {
            $payment = PremiumPayment::query()
                ->where('user_id', $user->id)
                ->where('provider', $provider)
                ->where('provider_order_id', $providerOrderId)
                ->with('user')
                ->lockForUpdate()
                ->firstOrFail();

            if ($payment->status === PremiumPayment::StatusCompleted) {
                $captureFailureReason = $this->capturedAmountFailureReason($payment);

                if ($captureFailureReason !== null) {
                    $this->markPaymentFailed($payment, $captureFailureReason);

                    return $payment->refresh();
                }

                if ($payment->user) {
                    $this->activatePremiumIfCompleted($payment->user, $payment);
                }

                return $payment->refresh();
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

            $payment->forceFill([
                'capture_request_id' => $requestId,
                'status' => PremiumPayment::StatusProcessing,
            ])->save();

            $this->recordPaymentEvent($payment, 'capture_requested', [
                'request_id' => $requestId,
            ]);

            return $payment->refresh();
        });

        if ($expiredCheckout) {
            throw new DomainException('This PayPal checkout expired after 3 hours. Please start a new payment.');
        }

        if ($captureFailureReason !== null) {
            throw new DomainException($captureFailureReason);
        }

        try {
            $capturedPayment = $this->paymentGatewayFactory
                ->make($provider)
                ->capturePremiumOrder($payment, (string) $payment->capture_request_id);
        } catch (RequestException $exception) {
            $this->recordPaymentEvent($payment, 'capture_failed', [
                'message' => $exception->getMessage(),
                'status' => $exception->response->status(),
                'response' => $exception->response->json(),
            ]);

            throw $exception;
        }

        $payment = DB::transaction(function () use ($capturedPayment, &$captureFailureReason): PremiumPayment {
            $payment = PremiumPayment::query()
                ->whereKey($capturedPayment->id)
                ->with('user')
                ->lockForUpdate()
                ->firstOrFail();

            $captureFailureReason = $this->capturedAmountFailureReason($payment);

            if ($captureFailureReason !== null) {
                $this->markPaymentFailed($payment, $captureFailureReason);

                return $payment->refresh();
            }

            $this->recordPaymentEvent($payment, 'capture_completed', [
                'status' => $payment->status,
            ]);

            if ($payment->user) {
                $this->activatePremiumIfCompleted($payment->user, $payment);
            }

            return $payment->refresh();
        });

        if ($captureFailureReason !== null) {
            throw new DomainException($captureFailureReason);
        }

        return $payment;
    }

    public function cancelExpiredPendingOrders(?Carbon $now = null): int
    {
        $expiresBefore = ($now ?? now())->copy()->subHours(PremiumPayment::CheckoutTimeoutHours);

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

                $this->recordPaymentEvent($cancelledPayment, 'checkout_cancelled', [
                    'reason' => 'expired',
                ]);

                if ($cancelledPayment->status === PremiumPayment::StatusCompleted && $lockedPayment->user) {
                    $captureFailureReason = $this->capturedAmountFailureReason($cancelledPayment);

                    if ($captureFailureReason !== null) {
                        $this->markPaymentFailed($cancelledPayment, $captureFailureReason);

                        return;
                    }

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

        if ($payment->premium_activated_at !== null) {
            return;
        }

        $startsAt = $user->premium_expires_at?->isFuture()
            ? $user->premium_expires_at
            : now();

        $user->forceFill([
            'premium_started_at' => $user->premium_started_at ?? now(),
            'premium_expires_at' => $startsAt->copy()->addMonthsNoOverflow($payment->months),
        ])->save();

        $payment->forceFill([
            'premium_activated_at' => now(),
        ])->save();

        $this->recordPaymentEvent($payment, 'premium_activated', [
            'premium_expires_at' => $user->premium_expires_at?->toISOString(),
        ]);
    }

    private function findReusablePendingPayment(User $user, int $months, string $provider): ?PremiumPayment
    {
        return PremiumPayment::query()
            ->where('user_id', $user->id)
            ->where('provider', $provider)
            ->where('months', $months)
            ->whereIn('status', PremiumPayment::pendingStatuses())
            ->where('created_at', '>', now()->subHours(PremiumPayment::CheckoutTimeoutHours))
            ->latest()
            ->get()
            ->first(fn (PremiumPayment $payment): bool => $payment->approvalUrl() !== null);
    }

    private function capturedAmountFailureReason(PremiumPayment $payment): ?string
    {
        if ($payment->status !== PremiumPayment::StatusCompleted) {
            return null;
        }

        $payload = $payment->payload['paypal_cancel_check'] ?? $payment->payload;

        $capture = collect($payload['purchase_units'] ?? [])
            ->flatMap(fn (array $unit): array => $unit['payments']['captures'] ?? [])
            ->first();

        $capturedCurrency = $capture['amount']['currency_code'] ?? null;
        $capturedValue = $capture['amount']['value'] ?? null;

        if ($capturedCurrency === null || $capturedValue === null) {
            return 'PayPal capture response did not include amount details.';
        }

        $capturedAmountCents = (int) round(((float) $capturedValue) * 100);

        if ($capturedCurrency !== $payment->currency || $capturedAmountCents !== $payment->amount_cents) {
            return 'PayPal capture amount does not match the premium order.';
        }

        return null;
    }

    private function markPaymentFailed(PremiumPayment $payment, string $reason): void
    {
        $payment->forceFill([
            'status' => PremiumPayment::StatusFailed,
            'payload' => [
                ...($payment->payload ?? []),
                'local_failure_reason' => $reason,
                'local_failed_at' => now()->toISOString(),
            ],
        ])->save();

        $this->recordPaymentEvent($payment, 'payment_failed', [
            'reason' => $reason,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function recordPaymentEvent(PremiumPayment $payment, string $type, array $payload = []): void
    {
        PremiumPaymentEvent::create([
            'premium_payment_id' => $payment->id,
            'type' => $type,
            'payload' => $payload === [] ? null : $payload,
        ]);
    }
}
