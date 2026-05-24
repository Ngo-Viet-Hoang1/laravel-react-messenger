<?php

use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Broadcast;
use App\Models\User;

Broadcast::channel('online', function ($user) {
    return $user ? new UserResource($user) : null;
});

Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId;
});

Broadcast::channel('message.user.{userId1}-{userId2}', function (User $user, int $userId1, int $userId2) {
    return $user->id === $userId1 || $user->id === $userId2;
});

Broadcast::channel('message.group.{groupId}', function (User $user, int $groupId) {
return $user->groups()->where('groups.id', $groupId)->exists();
});

Broadcast::channel('group.deleted.{groupId}', function (User $user, int $groupId) {
    return $user->groups->contains('id', $groupId);
});
