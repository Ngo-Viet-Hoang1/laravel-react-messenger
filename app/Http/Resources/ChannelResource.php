<?php

namespace App\Http\Resources;

use App\Models\Channel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class ChannelResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
    {
        /** @var Channel $this */
        $currentUser = $request->user();
        $isDirect = $this->type === 'direct';

        $otherUser = null;
        if ($isDirect && $this->relationLoaded('members') && $currentUser) {
            $otherUser = $this->members->firstWhere('id', '!=', $currentUser->id);
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $isDirect
                ? ($otherUser?->name ?? 'Direct Message')
                : $this->name,
            'avatar_url' => ($isDirect && $otherUser?->avatar_url)
                ? Storage::url($otherUser->avatar_url)
                : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'blocked_at' => $isDirect
                ? $otherUser?->blocked_at?->toISOString()
                : null,

            // last_message / last_message_date come from join-aliased columns in
            // getChannelsForUser(). Carbon::parse handles mixed string/Carbon values.
            'last_message_id' => $this->last_message_id !== null
                ? (int) $this->last_message_id
                : null,
            'last_message' => $this->last_message ?? null,
            'last_message_date' => $this->last_message_date !== null
                ? Carbon::parse($this->last_message_date)->toISOString()
                : null,
            'unread_count' => (int) ($this->unread_count ?? 0),

            'peer_user_id' => $isDirect ? $otherUser?->id : null,
            'peer_is_admin' => $isDirect ? (bool) $otherUser?->is_admin : null,
        ];
    }
}
