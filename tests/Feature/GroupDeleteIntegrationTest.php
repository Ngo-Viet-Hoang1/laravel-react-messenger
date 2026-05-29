<?php

namespace Tests\Feature;

use App\Events\ChannelDeleted;
use App\Jobs\DeleteChannelJob;
use App\Models\Channel;
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

    public function test_delete_endpoint_dispatches_job_and_job_deletes_channel(): void
    {
        Queue::fake();
        Event::fake([ChannelDeleted::class]);

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

        $this->actingAs($owner)
            ->delete(route('channels.destroy', $channel))
            ->assertOk();

        Queue::assertPushed(DeleteChannelJob::class, function (DeleteChannelJob $job) use ($channel) {
            return $job->channelId === $channel->id;
        });

        (new DeleteChannelJob($channel->id))->handle();

        $this->assertModelMissing($channel);
        $this->assertModelMissing($message);
        $this->assertModelMissing($attachment);

        // ChannelDeleted is broadcast to each member (owner + member = 2)
        Event::assertDispatched(ChannelDeleted::class, 2);
    }
}
