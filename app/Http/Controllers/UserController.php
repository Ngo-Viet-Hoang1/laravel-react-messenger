<?php

namespace App\Http\Controllers;

use App\Http\Requests\BlockUserRequest;
use App\Http\Requests\DemoteUserRequest;
use App\Http\Requests\PromoteUserRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UnblockUserRequest;
use App\Mail\UserCreated;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $rawPassword = Str::random(16);
        $data['password'] = bcrypt($rawPassword);
        $data['is_admin'] = $data['is_admin'] ?? false;
        $data['email_verified_at'] = now();

        $user = User::create($data);

        Mail::to($user->email)->send(new UserCreated($user, $rawPassword));

        return redirect()->back();
    }

    public function promote(PromoteUserRequest $request, User $user): JsonResponse
    {
        $user->update(['is_admin' => true]);

        return response()->json([
            'message' => "User {$user->name} has been promoted to admin.",
        ]);
    }

    public function demote(DemoteUserRequest $request, User $user): JsonResponse
    {
        $user->update(['is_admin' => false]);

        return response()->json([
            'message' => "User {$user->name} has been demoted to a regular user.",
        ]);
    }

    public function block(BlockUserRequest $request, User $user): JsonResponse
    {
        if ($request->user()?->is($user)) {
            return response()->json([
                'message' => 'You cannot block your own account.',
            ], 403);
        }

        if (!$user->blocked_at) {
            $user->update(['blocked_at' => now()]);
        }

        return response()->json([
            'message' => "User {$user->name} has been blocked.",
        ]);
    }

    public function unblock(UnblockUserRequest $request, User $user): JsonResponse
    {
        if ($request->user()?->is($user)) {
            return response()->json([
                'message' => 'You cannot block your own account.',
            ], 403);
        }

        if ($user->blocked_at) {
            $user->update(['blocked_at' => null]);
        }

        return response()->json([
            'message' => "User {$user->name} account has been unblocked.",
        ]);
    }
}
