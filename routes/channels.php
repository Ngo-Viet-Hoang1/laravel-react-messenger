<?php

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function (User $user) {
    return $user ? new UserResource($user) : null;
});

Broadcast::channel('message.channel.{channelId}', function (User $user, int $channelId) {
    return $user->channels()->whereKey($channelId)->exists() ? $user : null;
});

Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId ? $user : null;
});
