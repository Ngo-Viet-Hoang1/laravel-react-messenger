<?php

namespace App\Http\Resources;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageReactionResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Build aggregated reaction groups from a Message model.
     *
     * @return array<int, array{emoji: string, count: int, user_ids: array<int>}>
     */
    public static function aggregateForMessage(Message $message): array
    {
        if (! $message->relationLoaded('reactions')) {
            return [];
        }

        return $message->reactions
            ->groupBy('emoji')
            ->map(fn ($group, $emoji) => [
                'emoji' => $emoji,
                'count' => $group->count(),
                'user_ids' => $group->pluck('user_id')->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'message_id' => $this->message_id,
            'user_id' => $this->user_id,
            'emoji' => $this->emoji,
        ];
    }
}
