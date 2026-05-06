<?php

namespace App\Jobs;

use App\Events\GroupDeleted;
use App\Models\Group;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeleteGroupJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $groupId)
    {
    }

    public function handle(): void
    {
        $group = Group::find($this->groupId);
        if (!$group) {
            return;
        }

        $memberIds = $group->users()->pluck('users.id')->all();
        $groupName = $group->name;

        $group->update(['last_message_id' => null]);

        foreach ($memberIds as $memberId) {
            GroupDeleted::dispatch($memberId, $group->id, $groupName);
        }

        $group->messages()->chunkById(100, function ($messages) {
            $messages->each->delete();
        });

        $group->users()->detach();
        $group->delete();
    }
}
