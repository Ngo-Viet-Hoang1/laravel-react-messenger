<?php

namespace App\Console\Commands;

use App\Models\Message;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('messages:prune-expired-free-users {--days=90 : Number of days free-user messages are retained}')]
#[Description('Delete messages older than the retention window when their sender is not premium')]
class PruneExpiredFreeUserMessages extends Command
{
    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);
        $deletedCount = 0;

        Message::query()
            ->where('created_at', '<', $cutoff)
            ->whereHas('sender', function ($query): void {
                $query->whereNull('premium_expires_at')
                    ->orWhere('premium_expires_at', '<=', now());
            })
            ->with('attachments')
            ->orderBy('id')
            ->chunkById(100, function ($messages) use (&$deletedCount): void {
                foreach ($messages as $message) {
                    $message->delete();
                    $deletedCount++;
                }
            });

        $this->info("Deleted {$deletedCount} expired free-user messages.");

        return self::SUCCESS;
    }
}
