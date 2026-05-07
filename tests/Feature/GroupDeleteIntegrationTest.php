<?php

namespace Tests\Feature;

use App\Events\GroupDeleted;
use App\Jobs\DeleteGroupJob;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class GroupDeleteIntegrationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_delete_endpoint_dispatches_job_and_job_deletes_group(): void
    {
        Queue::fake();
        Event::fake([GroupDeleted::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        $group = Group::create([
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $group->users()->attach([$owner->id, $member->id]);

        $message = Message::create([
            'message' => 'Hello group',
            'sender_id' => $owner->id,
            'receiver_id' => null,
            'group_id' => $group->id,
        ]);

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => 'attachments/test/file.txt',
            'name' => 'file.txt',
            'size' => 12,
            'mime' => 'text/plain',
        ]);

        $this->actingAs($owner)
            ->delete(route('groups.destroy', $group))
            ->assertOk();

        Queue::assertPushed(DeleteGroupJob::class, function (DeleteGroupJob $job) use ($group) {
            return $job->groupId === $group->id;
        });

        (new DeleteGroupJob($group->id))->handle();

        $this->assertModelMissing($group);
        $this->assertModelMissing($message);
        $this->assertModelMissing($attachment);

        Event::assertDispatched(GroupDeleted::class, 2);
    }
}
