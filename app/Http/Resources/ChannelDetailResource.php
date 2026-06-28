<?php

namespace App\Http\Resources;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Full channel representation — used when a user opens a specific channel.
 * Extends the lean ChannelResource and adds:
 *   - description, owner_id
 *   - users (full member list with ids, names, avatars, roles)
 *   - user_ids (flat id array for the member picker)
 *
 * The members relation MUST be loaded before calling this resource,
 * otherwise users / user_ids will be omitted (whenLoaded guard).
 */
class ChannelDetailResource extends ChannelResource
{
    public function toArray(Request $request): array
    {
        /** @var Channel $this */
        $base = parent::toArray($request);

        return array_merge($base, [
            'description' => $this->description,
            'owner_id' => $this->owner_id,

            'users' => $this->whenLoaded(
                'members',
                fn () => $this->members->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'avatar_url' => $u->avatar_url ? Storage::url($u->avatar_url) : null,
                    'is_admin' => (bool) $u->is_admin,
                    'blocked_at' => $u->blocked_at,
                ])->values()
            ),

            'user_ids' => $this->whenLoaded('members', fn () => $this->members->pluck('id')->values()),
        ]);
    }
}
