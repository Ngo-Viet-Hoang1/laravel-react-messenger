<?php

namespace Tests\Feature;

use App\Models\PremiumPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CancelExpiredPremiumPaymentsTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::forget('paypal.access_token');
    }

    public function test_command_cancels_pending_premium_payments_after_60_minutes(): void
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
            'paypal.test/v2/checkout/orders/ORDER-EXPIRED' => Http::response([
                'id' => 'ORDER-EXPIRED',
                'status' => PremiumPayment::StatusCreated,
            ]),
        ]);

        $user = User::factory()->create();

        $expiredPayment = PremiumPayment::create([
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-EXPIRED',
            'status' => PremiumPayment::StatusCreated,
            'months' => 1,
            'amount_cents' => 499,
            'currency' => 'USD',
        ]);
        $expiredPayment->forceFill([
            'created_at' => now()->subMinutes(61),
            'updated_at' => now()->subMinutes(61),
        ])->save();

        $freshPayment = PremiumPayment::create([
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-FRESH',
            'status' => PremiumPayment::StatusCreated,
            'months' => 1,
            'amount_cents' => 499,
            'currency' => 'USD',
        ]);
        $freshPayment->forceFill([
            'created_at' => now()->subMinutes(59),
            'updated_at' => now()->subMinutes(59),
        ])->save();

        $this->artisan('premium:cancel-expired-payments')
            ->expectsOutput('Cancelled 1 expired premium payments.')
            ->assertSuccessful();

        $this->assertDatabaseHas('premium_payments', [
            'provider_order_id' => 'ORDER-EXPIRED',
            'status' => PremiumPayment::StatusCancelled,
        ]);

        $this->assertDatabaseHas('premium_payments', [
            'provider_order_id' => 'ORDER-FRESH',
            'status' => PremiumPayment::StatusCreated,
        ]);
    }

    public function test_command_does_not_cancel_payment_that_paypal_reports_completed(): void
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
            'paypal.test/v2/checkout/orders/ORDER-COMPLETED' => Http::response([
                'id' => 'ORDER-COMPLETED',
                'status' => PremiumPayment::StatusCompleted,
            ]),
        ]);

        $user = User::factory()->create();

        $payment = PremiumPayment::create([
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-COMPLETED',
            'status' => PremiumPayment::StatusCreated,
            'months' => 1,
            'amount_cents' => 499,
            'currency' => 'USD',
        ]);
        $payment->forceFill([
            'created_at' => now()->subMinutes(61),
            'updated_at' => now()->subMinutes(61),
        ])->save();

        $this->artisan('premium:cancel-expired-payments')
            ->expectsOutput('Cancelled 0 expired premium payments.')
            ->assertSuccessful();

        $this->assertDatabaseHas('premium_payments', [
            'provider_order_id' => 'ORDER-COMPLETED',
            'status' => PremiumPayment::StatusCompleted,
        ]);

        $this->assertTrue($user->refresh()->isPremium());
    }

    public function test_expired_pending_payment_cannot_be_captured(): void
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
            'paypal.test/v2/checkout/orders/ORDER-LATE' => Http::response([
                'id' => 'ORDER-LATE',
                'status' => PremiumPayment::StatusCreated,
            ]),
        ]);

        $user = User::factory()->create();

        $payment = PremiumPayment::create([
            'user_id' => $user->id,
            'provider' => 'paypal',
            'provider_order_id' => 'ORDER-LATE',
            'status' => PremiumPayment::StatusCreated,
            'months' => 1,
            'amount_cents' => 499,
            'currency' => 'USD',
        ]);
        $payment->forceFill([
            'created_at' => now()->subMinutes(61),
            'updated_at' => now()->subMinutes(61),
        ])->save();

        $this->actingAs($user)
            ->postJson(route('premium.paypal.capture', ['orderId' => 'ORDER-LATE']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This PayPal checkout expired after 60 minutes. Please start a new payment.');

        $this->assertDatabaseHas('premium_payments', [
            'provider_order_id' => 'ORDER-LATE',
            'status' => PremiumPayment::StatusCancelled,
        ]);

        Http::assertSentCount(2);
    }
}
