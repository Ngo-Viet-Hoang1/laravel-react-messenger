<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url ? Storage::url($this->avatar_url) : null,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'blocked_at' => $this->blocked_at,
            'is_admin' => $this->is_admin,
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date,
            'public_key' => $this->public_key,
            'public_key_fingerprint' => $this->public_key_fingerprint,
            'key_version' => $this->key_version,
        ];
    }
}
