<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MessageAttachmentResource extends JsonResource
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
            'message_id' => $this->message_id,
            'name' => $this->name,
            'mime' => $this->mime,
            'size' => $this->size,
            'path' => $this->path,
            'storage_disk' => $this->storage_disk,
            'thumbnail_path' => $this->thumbnail_path,
            'url' => Storage::disk($this->storage_disk)->url($this->path),
            'thumbnail_url' => $this->thumbnail_path ? Storage::disk($this->storage_disk)->url($this->thumbnail_path) : null,
            'stream_url' => route('attachments.stream', $this->id),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
