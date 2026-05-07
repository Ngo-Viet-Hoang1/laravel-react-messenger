<?php

namespace Tests\Feature;

use App\Jobs\DeleteGroupJob;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DeleteGroupJobTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_job_deletes_group_and_messages(): void
    {
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

        $group->update(['last_message_id' => $message->id]);

        DeleteGroupJob::dispatchSync($group->id);

        $this->assertModelMissing($group);
        $this->assertModelMissing($message);
        $this->assertModelMissing($attachment);
    }

    public function test_job_handles_missing_group(): void
    {
        DeleteGroupJob::dispatchSync(9999);

        $this->assertTrue(true);
    }
}
