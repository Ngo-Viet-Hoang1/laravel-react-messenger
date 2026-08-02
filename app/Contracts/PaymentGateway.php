<?php

namespace App\Contracts;

use App\Models\PremiumPayment;
use App\Models\User;

interface PaymentGateway
{
    /**
     * @return array{payment: PremiumPayment, approval_url: string|null}
     */
    public function createPremiumOrder(User $user, int $months, string $requestId): array;

    public function capturePremiumOrder(PremiumPayment $payment, string $requestId): PremiumPayment;

    public function cancelPremiumOrder(PremiumPayment $payment): PremiumPayment;
}
