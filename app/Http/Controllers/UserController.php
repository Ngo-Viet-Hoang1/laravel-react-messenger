<?php

namespace App\Http\Controllers;

use App\Mail\UserCreated;
use App\Mail\UserBlockedUnblocked;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\UserRoleChanged;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => ['required', 'email', 'unique:users,email'],
            'is_admin' => 'boolean',
        ]);

        $rawPassword = Str::random(8);
        $data['password'] = bcrypt($rawPassword);
        $data['email_verified_at'] = now();

        $user = User::create($data);

        Mail::to($user)->send(new UserCreated($user, $rawPassword));

        return redirect()->back();
    }

    public function changeRole(User $user)
    {
        $user->update(['is_admin' => ! (bool) $user->is_admin]);
        $message = 'User role was changed to '.($user->is_admin ? 'Admin' : 'Regular User');

        Mail::to($user)->send(new UserRoleChanged($user));

        return response()->json([
            'message' => $message,
            'user' => [
                'id' => $user->id,
                'is_admin' => (bool) $user->is_admin,
            ],
        ]);
    }

    public function blockUnblock(User $user)
    {
        $blockedAt = $user->blocked_at ? null : now();
        $user->update(['blocked_at' => $blockedAt]);

        $message = $blockedAt
            ? "User {$user->name} has been blocked."
            : "User {$user->name} has been activated.";

        Mail::to($user)->send(new UserBlockedUnblocked($user));

        return response()->json([
            'message' => $message,
            'user' => [
                'id' => $user->id,
                'blocked_at' => $user->blocked_at,
            ],
        ]);
    }
}
