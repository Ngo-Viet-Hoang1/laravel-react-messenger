<?php

namespace Tests\Feature;

use App\Jobs\DeleteChannelJob;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DeleteChannelJobTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_job_deletes_channel_and_messages(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $channel = Channel::create([
            'type' => 'group',
            'name' => 'Team Alpha',
            'description' => 'Original',
            'owner_id' => $owner->id,
        ]);

        $channel->members()->attach([$owner->id, $member->id]);

        $message = Message::create([
            'channel_id' => $channel->id,
            'sender_id' => $owner->id,
            'content' => 'Hello channel',
        ]);

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'path' => 'attachments/test/file.txt',
            'name' => 'file.txt',
            'size' => 12,
            'mime' => 'text/plain',
            'storage_disk' => 'local',
        ]);

        $channel->update(['last_message_id' => $message->id]);

        DeleteChannelJob::dispatchSync($channel->id);

        $this->assertModelMissing($channel);
        $this->assertModelMissing($message);
        $this->assertModelMissing($attachment);
    }

    public function test_job_handles_missing_channel(): void
    {
        DeleteChannelJob::dispatchSync(9999);

        $this->assertTrue(true);
    }
}
