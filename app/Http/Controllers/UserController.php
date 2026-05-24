<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'is_admin' => 'required|boolean',
        ]);

        // $rawPassword = Str::random(8);
        $rawPassword = 'password'; // For testing purposes, use a fixed password
        $data['password'] = bcrypt($rawPassword);
        $data['email_verified_at'] = now();

        $user = User::create($data);

        return redirect()->back();
    }

    public function changeRole(User $user)
    {
        $user->update(['is_admin' => !(bool) $user->is_admin]);
        $message = "User role was changed to " . ($user->is_admin ? 'Admin' : 'Regular User') . ".";
        
        return response()->json(['message' => $message]);
    }

    public function blockUnblock(User $user)
    {
        if ($user->blocked_at) {
            $user->blocked_at = null;
            $message = 'User' . ' was unblocked.';
        } else {
            $user->blocked_at = now();
            $message = 'User' . ' was blocked.';
        }
        $user->save();

        return response()->json(['message' => $message]);
    }
}
