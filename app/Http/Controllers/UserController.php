<?php

namespace App\Http\Controllers;

use App\Http\Requests\BlockUserRequest;
use App\Http\Requests\DemoteUserRequest;
use App\Http\Requests\PromoteUserRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UnblockUserRequest;
use App\Mail\UserCreated;
use App\Models\User;
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

    public function promote(PromoteUserRequest $request, User $user): RedirectResponse
    {
        $user->update(['is_admin' => true]);

        return redirect()->back();
    }

    public function demote(DemoteUserRequest $request, User $user): RedirectResponse
    {
        $user->update(['is_admin' => false]);

        return redirect()->back();
    }

    public function block(BlockUserRequest $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            abort(403, 'You cannot block your own account.');
        }

        if (!$user->blocked_at) {
            $user->update(['blocked_at' => now()]);
        }

        return redirect()->back();
    }

    public function unblock(UnblockUserRequest $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            abort(403, 'You cannot unblock your own account.');
        }

        if ($user->blocked_at) {
            $user->update(['blocked_at' => null]);
        }

        return redirect()->back();
    }
}
