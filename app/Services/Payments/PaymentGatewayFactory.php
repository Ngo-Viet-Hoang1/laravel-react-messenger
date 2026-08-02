<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use InvalidArgumentException;

class PaymentGatewayFactory
{
    public function __construct(
        private PaypalPaymentGateway $paypalPaymentGateway,
    ) {}

    public function make(string $provider): PaymentGateway
    {
        return match ($provider) {
            'paypal' => $this->paypalPaymentGateway,
            default => throw new InvalidArgumentException("Unsupported payment provider [{$provider}]."),
        };
    }
}
