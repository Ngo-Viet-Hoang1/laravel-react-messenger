<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => ['required', 'email', 'unique:users,email'],
            'is_admin' => 'boolean',
        ]);
        // generate random password
        // $rawPassword = Str::random(8);
        $rawPassword = 'password';
        $data['password'] = bcrypt($rawPassword);
        $data['email_verified_at'] = now();

        $user = User::create($data);

        return redirect()->back();
    }

    public function changeRole(User $user)
    {
        $user->update(['is_admin' => ! (bool) $user->is_admin]);
        $message = 'User role was changed to '.($user->is_admin ? 'Admin' : 'Regular User');

        return response()->json(['message' => $message]);
    }

    public function blockUnblock(User $user)
    {
        $blockedAt = $user->blocked_at ? null : now();
        $user->update(['blocked_at' => $blockedAt]);

        $message = $blockedAt
            ? "User {$user->name} has been blocked."
            : "User {$user->name} has been activated.";

        return response()->json(['message' => $message]);
    }
}
