<?php

namespace App\Console\Commands;

use App\Services\PremiumCheckoutService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('premium:cancel-expired-payments')]
#[Description('Cancel premium payment checkouts that were not completed within 5 days')]
class CancelExpiredPremiumPayments extends Command
{
    public function handle(PremiumCheckoutService $premiumCheckoutService): int
    {
        $cancelledCount = $premiumCheckoutService->cancelExpiredPendingOrders();

        $this->info("Cancelled {$cancelledCount} expired premium payments.");

        return self::SUCCESS;
    }
}
