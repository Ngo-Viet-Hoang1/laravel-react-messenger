<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PremiumPaymentTest extends TestCase
{
    use LazilyRefreshDatabase;

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
