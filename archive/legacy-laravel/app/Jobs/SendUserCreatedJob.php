<?php

namespace App\Jobs;

use App\Mail\UserCreated;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Mail;

class SendUserCreatedJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(public int $userId, public string $rawPassword)
    {
    }

    public function handle(): void
    {
        $user = User::find($this->userId);
        if (!$user) {
            return;
        }

        Mail::to($user->email)->send(new UserCreated($user, $this->rawPassword));
    }
}
