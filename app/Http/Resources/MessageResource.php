<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
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
            'content' => $this->content,
            'channel_id' => $this->channel_id,
            'sender_id' => $this->sender_id,
            'parent_id' => $this->parent_id,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'parent' => new MessageResource($this->whenLoaded('parent')),
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'reactions' => $this->whenLoaded('reactions', fn () => MessageReactionResource::aggregateForMessage($this->resource)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
