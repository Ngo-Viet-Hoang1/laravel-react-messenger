<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function (User $user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
    ];
});

Broadcast::channel('message.user.{userId1}-{userId2}', function (User $user, int $userId1, int $userId2) {
    return $user->id === $userId1 || $user->id === $userId2;
});

Broadcast::channel('message.group.{groupId}', function (User $user, int $groupId) {
    return $user->groups()->whereKey($groupId)->exists();
});
