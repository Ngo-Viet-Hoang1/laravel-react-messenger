<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageReportResource extends JsonResource
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
            'reported_by' => $this->reported_by,
            'reason' => $this->reason,
            'note' => $this->note,
            'status' => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at,
            'message' => new MessageResource($this->whenLoaded('message')),
            'reporter' => new UserResource($this->whenLoaded('reporter')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'sibling_reports' => MessageReportResource::collection($this->whenLoaded('siblingReports')),
            'reports_count' => $this->when(isset($this->sibling_reports_count), $this->sibling_reports_count),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
