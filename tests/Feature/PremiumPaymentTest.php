<?php

namespace Tests\Feature;

use App\Models\PremiumPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PremiumPaymentTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::forget('paypal.access_token');
    }

    public function test_user_can_create_and_capture_paypal_premium_order(): void
    {
        config([
            'services.paypal.base_url' => 'https://paypal.test',
            'services.paypal.client_id' => 'client-id',
            'services.paypal.client_secret' => 'client-secret',
            'services.paypal.premium_price_cents' => 499,
            'services.paypal.premium_currency' => 'USD',
        ]);

        Http::fake([
            'paypal.test/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
                'token_type' => 'Bearer',
                'expires_in' => 3600,
            ]),
            'paypal.test/v2/checkout/orders' => Http::response([
                'id' => 'ORDER-123',
                'status' => 'CREATED',
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://paypal.test/checkout/ORDER-123'],
                ],
            ]),
            'paypal.test/v2/checkout/orders/ORDER-123/capture' => Http::response([
                'id' => 'ORDER-123',
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'payments' => [
                        'captures' => [[
                            'amount' => [
                                'currency_code' => 'USD',
                                'value' => '14.97',
                            ],
                        ]],
                    ],
                ]],
            ]),
        ]);

        $user = User::factory()->create();

        $checkoutResponse = $this->actingAs($user)
            ->postJson(route('premium.paypal.checkout'), ['months' => 3]);

        $checkoutResponse
            ->assertCreated()
            ->assertJsonPath('provider_order_id', 'ORDER-123')
            ->assertJsonPath('approval_url', 'https://paypal.test/checkout/ORDER-123');

        $this->assertDatabaseHas('premium_payments', [
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-123',
            'status' => 'CREATED',
            'months' => 3,
            'amount_cents' => 1497,
        ]);

        $captureResponse = $this->actingAs($user)
            ->postJson(route('premium.paypal.capture', ['orderId' => 'ORDER-123']));

        $captureResponse
            ->assertOk()
            ->assertJsonPath('status', 'COMPLETED');

        $user->refresh();

        $this->assertTrue($user->isPremium());
        $this->assertNotNull($user->premium_started_at);
        $this->assertNotNull($user->premium_expires_at);

        $this->assertDatabaseHas('premium_payments', [
            'provider_order_id' => 'ORDER-123',
            'status' => 'COMPLETED',
        ]);

        $this->assertDatabaseMissing('premium_payments', [
            'provider_order_id' => 'ORDER-123',
            'capture_request_id' => null,
        ]);

        $this->assertDatabaseMissing('premium_payments', [
            'provider_order_id' => 'ORDER-123',
            'premium_activated_at' => null,
        ]);

        $this->assertDatabaseHas('premium_payment_events', [
            'type' => 'premium_activated',
        ]);

        $this->actingAs($user)
            ->postJson(route('premium.paypal.capture', ['orderId' => 'ORDER-123']))
            ->assertOk()
            ->assertJsonPath('status', PremiumPayment::StatusCompleted);

        Http::assertSentCount(4);
    }

    public function test_repeated_checkout_reuses_existing_pending_paypal_order(): void
    {
        config([
            'services.paypal.base_url' => 'https://paypal.test',
            'services.paypal.client_id' => 'client-id',
            'services.paypal.client_secret' => 'client-secret',
            'services.paypal.premium_price_cents' => 499,
            'services.paypal.premium_currency' => 'USD',
        ]);

        Http::fake([
            'paypal.test/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
                'token_type' => 'Bearer',
                'expires_in' => 3600,
            ]),
            'paypal.test/v2/checkout/orders' => Http::response([
                'id' => 'ORDER-DOUBLE',
                'status' => 'CREATED',
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://paypal.test/checkout/ORDER-DOUBLE'],
                ],
            ]),
        ]);

        $user = User::factory()->create();

        $firstCheckoutResponse = $this->actingAs($user)
            ->postJson(route('premium.paypal.checkout'), ['months' => 1]);

        $secondCheckoutResponse = $this->actingAs($user)
            ->postJson(route('premium.paypal.checkout'), ['months' => 1]);

        $firstCheckoutResponse
            ->assertCreated()
            ->assertJsonPath('provider_order_id', 'ORDER-DOUBLE');

        $secondCheckoutResponse
            ->assertCreated()
            ->assertJsonPath('provider_order_id', 'ORDER-DOUBLE')
            ->assertJsonPath('approval_url', 'https://paypal.test/checkout/ORDER-DOUBLE');

        $this->assertSame(
            $firstCheckoutResponse->json('payment_id'),
            $secondCheckoutResponse->json('payment_id'),
        );

        $this->assertSame(1, PremiumPayment::query()->count());

        $this->assertDatabaseHas('premium_payment_events', [
            'type' => 'checkout_created',
        ]);

        $this->assertDatabaseHas('premium_payment_events', [
            'type' => 'checkout_reused',
        ]);

        Http::assertSentCount(2);
    }

    public function test_premium_page_shows_only_authenticated_users_payment_history(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $completedPayment = PremiumPayment::create([
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-MINE',
            'status' => PremiumPayment::StatusCompleted,
            'months' => 3,
            'amount_cents' => 1497,
            'currency' => 'USD',
            'captured_at' => now(),
            'premium_activated_at' => now(),
        ]);
        $completedPayment->forceFill([
            'created_at' => now()->subMinutes(2),
            'updated_at' => now()->subMinutes(2),
        ])->save();

        $pendingPayment = PremiumPayment::create([
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-PENDING',
            'status' => PremiumPayment::StatusCreated,
            'months' => 1,
            'amount_cents' => 499,
            'currency' => 'USD',
            'payload' => [
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://paypal.test/checkout/ORDER-PENDING'],
                ],
            ],
        ]);
        $pendingPayment->forceFill([
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ])->save();

        PremiumPayment::create([
            'user_id' => $otherUser->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-OTHER',
            'status' => PremiumPayment::StatusCompleted,
            'months' => 1,
            'amount_cents' => 499,
            'currency' => 'USD',
            'captured_at' => now(),
            'premium_activated_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('premium.index'));

        $response
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Premium/Index')
                ->has('payments', 2)
                ->where('payments.0.provider_order_id', 'ORDER-PENDING')
                ->where('payments.0.can_continue_payment', true)
                ->where('payments.0.approval_url', 'https://paypal.test/checkout/ORDER-PENDING')
                ->where('payments.1.provider_order_id', 'ORDER-MINE')
                ->where('payments.1.can_continue_payment', false)
                ->missing('payments.2')
            );
    }

    public function test_capture_fails_when_paypal_amount_does_not_match_order(): void
    {
        config([
            'services.paypal.base_url' => 'https://paypal.test',
            'services.paypal.client_id' => 'client-id',
            'services.paypal.client_secret' => 'client-secret',
            'services.paypal.premium_price_cents' => 499,
            'services.paypal.premium_currency' => 'USD',
        ]);

        Http::fake([
            'paypal.test/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
                'token_type' => 'Bearer',
                'expires_in' => 3600,
            ]),
            'paypal.test/v2/checkout/orders' => Http::response([
                'id' => 'ORDER-MISMATCH',
                'status' => 'CREATED',
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://paypal.test/checkout/ORDER-MISMATCH'],
                ],
            ]),
            'paypal.test/v2/checkout/orders/ORDER-MISMATCH/capture' => Http::response([
                'id' => 'ORDER-MISMATCH',
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'payments' => [
                        'captures' => [[
                            'amount' => [
                                'currency_code' => 'USD',
                                'value' => '1.00',
                            ],
                        ]],
                    ],
                ]],
            ]),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('premium.paypal.checkout'), ['months' => 1])
            ->assertCreated();

        $this->actingAs($user)
            ->postJson(route('premium.paypal.capture', ['orderId' => 'ORDER-MISMATCH']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'PayPal capture amount does not match the premium order.');

        $this->assertFalse($user->refresh()->isPremium());

        $this->assertDatabaseHas('premium_payments', [
            'provider_order_id' => 'ORDER-MISMATCH',
            'status' => PremiumPayment::StatusFailed,
        ]);

        $this->assertDatabaseHas('premium_payment_events', [
            'type' => 'payment_failed',
        ]);
    }

    public function test_user_cannot_capture_another_users_paypal_order(): void
    {
        config([
            'services.paypal.base_url' => 'https://paypal.test',
            'services.paypal.client_id' => 'client-id',
            'services.paypal.client_secret' => 'client-secret',
        ]);

        Http::fake([
            'paypal.test/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
                'token_type' => 'Bearer',
                'expires_in' => 3600,
            ]),
            'paypal.test/v2/checkout/orders' => Http::response([
                'id' => 'ORDER-456',
                'status' => 'CREATED',
                'links' => [],
            ]),
        ]);

        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->actingAs($owner)
            ->postJson(route('premium.paypal.checkout'));

        $this->actingAs($otherUser)
            ->postJson(route('premium.paypal.capture', ['orderId' => 'ORDER-456']))
            ->assertNotFound();
    }
}
