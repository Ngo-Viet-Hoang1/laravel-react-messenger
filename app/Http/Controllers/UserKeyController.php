<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserKeyController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'public_key' => ['required', 'array'],
            'public_key.kty' => ['required', 'string', 'in:EC'],
            'public_key.crv' => ['required', 'string', 'in:P-256'],
            'public_key.x' => ['required', 'string'],
            'public_key.y' => ['required', 'string'],
        ]);

        $publicKey = $request->input('public_key');

        ksort($publicKey);
        $fingerprint = hash('sha256', json_encode($publicKey));

        $request->user()->update([
            'public_key' => $publicKey,
            'public_key_fingerprint' => $fingerprint,
        ]);

        return response()->json([
            'fingerprint' => $fingerprint,
        ]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'public_key' => $user->public_key,
            'fingerprint' => $user->public_key_fingerprint,
            'key_version' => $user->key_version,
        ]);
    }
}
