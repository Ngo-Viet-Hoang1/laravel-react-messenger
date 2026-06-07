<?php

namespace App\Http\Controllers;

use App\Http\Requests\BlockUserRequest;
use App\Http\Requests\DemoteUserRequest;
use App\Http\Requests\PromoteUserRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UnblockUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Jobs\SendUserCreatedJob;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Response;

class UserController extends Controller
{
    public function adminIndex(Request $request): Response|JsonResponse
    {
        $query = User::whereKeyNot(auth()->id())
            ->select('id', 'name', 'email', 'avatar_url', 'is_admin', 'blocked_at', 'created_at')
            ->orderBy('name');

        $q = trim($request->input('q', ''));
        if ($q !== '') {
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $role = trim($request->input('role', ''));
        if ($role === 'admin') {
            $query->where('is_admin', true);
        } elseif ($role === 'user') {
            $query->where('is_admin', false);
        }

        $status = trim($request->input('status', ''));
        if ($status === 'active') {
            $query->whereNull('blocked_at');
        } elseif ($status === 'blocked') {
            $query->whereNotNull('blocked_at');
        }

        $users = UserResource::collection($query->paginate(6)->withQueryString());

        if ($request->wantsJson()) {
            return response()->json([
                'users' => $users->response()->getData(true),
                'filters' => [
                    'q' => $q,
                    'role' => $role,
                    'status' => $status,
                ],
            ]);
        }

        return inertia('Admin/Users', [
            'users' => $users,
            'filters' => [
                'q' => $q,
                'role' => $role,
                'status' => $status,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::whereKeyNot(auth()->id())
            ->select('id', 'name', 'email', 'avatar_url', 'is_admin', 'blocked_at')
            ->orderBy('name');

        if ($request->boolean('include_blocked') && auth()->user()?->is_admin) {
            // No blocked_at filter
        } else {
            $query->whereNull('blocked_at');
        }

        if ($q = $request->string('q')->trim()) {
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        return response()->json(UserResource::collection($query->get()));
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $rawPassword = Str::random(16);
        $data['password'] = bcrypt($rawPassword);
        $data['is_admin'] = $data['is_admin'] ?? false;
        $data['email_verified_at'] = now();

        $user = User::create($data);

        SendUserCreatedJob::dispatch($user->id, $rawPassword);

        return redirect()->back();
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        unset($data['email']);

        $user->fill($data);
        $user->save();

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

        if (! $user->blocked_at) {
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

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            abort(403, 'You cannot delete your own account.');
        }

        if ($user->avatar_url) {
            Storage::disk('public')->delete($user->avatar_url);
        }

        $user->delete();

        return redirect()->back();
    }
}
