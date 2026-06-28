<?php

namespace App\Http\Controllers;

use App\Http\Resources\PremiumPaymentResource;
use App\Services\PremiumCheckoutService;
use DomainException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PremiumController extends Controller
{
    public function __construct(
        private PremiumCheckoutService $premiumCheckoutService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Premium/Index', [
            'plans' => [
                ['months' => 1, 'label' => '1 month'],
                ['months' => 3, 'label' => '3 months'],
                ['months' => 12, 'label' => '12 months'],
            ],
            'priceCents' => (int) config('services.paypal.premium_price_cents'),
            'currency' => (string) config('services.paypal.premium_currency'),
            'payments' => PremiumPaymentResource::collection(
                $user->premiumPayments()
                    ->latest()
                    ->limit(20)
                    ->get()
            )->resolve($request),
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'months' => ['sometimes', 'integer', 'in:1,3,12'],
        ]);

        try {
            $checkout = $this->premiumCheckoutService->createOrder(
                $request->user(),
                (int) ($validated['months'] ?? 1),
            );
        } catch (RequestException $exception) {
            return $this->paypalErrorResponse($exception);
        }

        return response()->json([
            'payment_id' => $checkout['payment']->id,
            'provider_order_id' => $checkout['payment']->provider_order_id,
            'approval_url' => $checkout['approval_url'],
        ], 201);
    }

    public function capture(Request $request, string $orderId): JsonResponse
    {
        try {
            $payment = $this->premiumCheckoutService->captureOrder($request->user(), $orderId);
        } catch (RequestException $exception) {
            return $this->paypalErrorResponse($exception);
        } catch (DomainException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => $payment->status,
            'premium_expires_at' => $request->user()->refresh()->premium_expires_at,
        ]);
    }

    private function paypalErrorResponse(RequestException $exception): JsonResponse
    {
        $payload = $exception->response->json();

        return response()->json([
            'message' => $payload['message'] ?? 'PayPal could not process this payment request.',
            'paypal_error' => $payload,
        ], $exception->response->status() === 400 ? 422 : 502);
    }
}
