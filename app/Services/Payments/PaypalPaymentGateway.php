<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\PremiumPayment;
use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PaypalPaymentGateway implements PaymentGateway
{
    /**
     * @return array{payment: PremiumPayment, approval_url: string|null}
     */
    public function createPremiumOrder(User $user, int $months, string $requestId): array
    {
        $amountCents = (int) config('services.paypal.premium_price_cents') * $months;
        $currency = (string) config('services.paypal.premium_currency');

        $payload = $this->clientWithToken()
            ->withHeaders(['PayPal-Request-Id' => $requestId])
            ->post('/v2/checkout/orders', [
                'intent' => 'CAPTURE',
                'application_context' => [
                    'return_url' => route('premium.index', ['status' => 'approved']),
                    'cancel_url' => route('premium.index', ['status' => 'cancelled']),
                    'user_action' => 'PAY_NOW',
                ],
                'purchase_units' => [[
                    'reference_id' => 'premium-'.$user->id.'-'.$months,
                    'amount' => [
                        'currency_code' => $currency,
                        'value' => number_format($amountCents / 100, 2, '.', ''),
                    ],
                ]],
            ])
            ->throw()
            ->json();

        $payment = PremiumPayment::create([
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => $payload['id'],
            'create_request_id' => $requestId,
            'status' => $payload['status'] ?? PremiumPayment::StatusCreated,
            'months' => $months,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'payload' => $payload,
        ]);

        $approvalLink = collect($payload['links'] ?? [])->firstWhere('rel', 'approve');

        return [
            'payment' => $payment,
            'approval_url' => is_array($approvalLink) ? ($approvalLink['href'] ?? null) : null,
        ];
    }

    public function capturePremiumOrder(PremiumPayment $payment, string $requestId): PremiumPayment
    {
        $payload = $this->clientWithToken()
            ->withHeaders(['PayPal-Request-Id' => $requestId])
            ->withBody('{}', 'application/json')
            ->post("/v2/checkout/orders/{$payment->provider_order_id}/capture")
            ->throw()
            ->json();

        $payment->forceFill([
            'status' => $payload['status'],
            'capture_request_id' => $requestId,
            'payload' => $payload,
            'captured_at' => $payload['status'] === PremiumPayment::StatusCompleted ? now() : null,
        ])->save();

        return $payment;
    }

    public function cancelPremiumOrder(PremiumPayment $payment): PremiumPayment
    {
        $payload = $this->clientWithToken()
            ->get("/v2/checkout/orders/{$payment->provider_order_id}")
            ->throw()
            ->json();

        $remoteStatus = (string) ($payload['status'] ?? $payment->status);

        $payment->forceFill([
            'status' => $remoteStatus === PremiumPayment::StatusCompleted
                ? PremiumPayment::StatusCompleted
                : PremiumPayment::StatusCancelled,
            'payload' => [
                ...($payment->payload ?? []),
                'paypal_cancel_check' => $payload,
                'local_cancelled_at' => $remoteStatus === PremiumPayment::StatusCompleted ? null : now()->toISOString(),
                'local_cancel_reason' => $remoteStatus === PremiumPayment::StatusCompleted
                    ? null
                    : 'Checkout was not completed within 3 hours.',
            ],
            'captured_at' => $remoteStatus === PremiumPayment::StatusCompleted
                ? ($payment->captured_at ?? now())
                : $payment->captured_at,
        ])->save();

        return $payment;
    }

    private function clientWithToken(): PendingRequest
    {
        return Http::withToken($this->accessToken())
            ->retry(3, 200, throw: false)
            ->baseUrl((string) config('services.paypal.base_url'))
            ->acceptJson()
            ->asJson();
    }

    private function accessToken(): string
    {
        return Cache::remember('paypal.access_token', now()->addMinutes(50), function (): string {
            $payload = $this->basicClient()
                ->asForm()
                ->post('/v1/oauth2/token', [
                    'grant_type' => 'client_credentials',
                ])
                ->throw()
                ->json();

            return (string) $payload['access_token'];
        });
    }

    private function basicClient(): PendingRequest
    {
        return Http::withBasicAuth(
            (string) config('services.paypal.client_id'),
            (string) config('services.paypal.client_secret'),
        )
            ->retry(3, 200, throw: false)
            ->baseUrl((string) config('services.paypal.base_url'))
            ->acceptJson();
    }
}
