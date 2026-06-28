<?php

namespace App\Http\Controllers;

use App\Events\ChannelReadUpdated;
use App\Http\Requests\StoreChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Http\Resources\ChannelDetailResource;
use App\Http\Resources\ChannelResource;
use App\Http\Resources\MessageAttachmentResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Models\Channel;
use App\Models\User;
use App\Services\ChannelService;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Response;

class ChannelController extends Controller
{
    public function __construct(
        private ChannelService $channelService,
        private MessageService $messageService
    ) {}

    public function show(Channel $channel): Response
    {
        $user = auth()->user();

        abort_unless(
            $user->channels()->whereKey($channel->id)->exists(),
            403,
        );

        $channels = ChannelResource::collection(
            $this->channelService->getChannelsForUser($user)
        )->resolve(request());

        $selectedChannel = new ChannelDetailResource($this->channelService->getChannelDetail($channel));

        $messages = MessageResource::collection(
            $this->messageService->getMessagesForChannel($channel)
        );

        return inertia('Home', compact('channels', 'selectedChannel', 'messages'));
    }

    public function markAsRead(Channel $channel): JsonResponse
    {
        $user = auth()->user();

        abort_unless($user?->channels()->whereKey($channel->id)->exists(), 403);

        $lastReadMessageId = $channel->last_message_id;

        $this->channelService->markAsRead($channel, (int) $user->id, $lastReadMessageId ? (int) $lastReadMessageId : null);

        broadcast(new ChannelReadUpdated($channel->id, (int) $user->id, $lastReadMessageId ? (int) $lastReadMessageId : null))->toOthers();

        return response()->json([
            'channel_id' => $channel->id,
            'last_read_message_id' => $lastReadMessageId ? (int) $lastReadMessageId : null,
        ]);
    }

    public function store(StoreChannelRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $channel = $this->channelService->createChannel($data);

        return redirect()->route('channels.show', $channel->id);
    }

    public function findOrCreateDirect(User $user): RedirectResponse
    {
        $authUserId = (int) auth()->id();

        abort_if($authUserId === $user->id, 422, 'Cannot create DM with yourself.');

        if (! auth()->user()?->is_admin) {
            abort_if($user->blocked_at !== null, 403, 'Cannot message a blocked user.');
        }

        $channel = $this->channelService->findOrCreateDirect($authUserId, $user->id);

        return redirect()->route('channels.show', $channel->id);
    }

    public function getMembers(Channel $channel): JsonResponse
    {
        abort_unless(
            auth()->user()?->channels()->whereKey($channel->id)->exists(),
            403,
        );
        $members = $this->channelService->getMembers($channel);

        return response()->json(UserResource::collection($members));
    }

    public function addMember(Channel $channel, User $user): JsonResponse
    {
        $authUser = auth()->user();

        abort_if($channel->type === 'direct', 403, 'Cannot add members to a direct channel.');
        abort_unless($authUser?->is_admin || $channel->owner_id === (int) $authUser?->id, 403, 'Unauthorized.');
        abort_if($channel->members()->whereKey($user->id)->exists(), 422, 'User is already a member.');

        $this->channelService->addMember($channel, $user);

        return response()->json(['message' => 'Member added successfully.']);
    }

    public function removeMember(Channel $channel, User $user): JsonResponse
    {
        $authUser = auth()->user();

        abort_if($channel->type === 'direct', 403, 'Cannot remove members from a direct channel.');
        abort_unless($authUser?->is_admin || $channel->owner_id === (int) $authUser?->id, 403, 'Unauthorized.');
        abort_if($channel->owner_id === $user->id, 422, 'Cannot remove the channel owner.');

        $this->channelService->removeMember($channel, $user);

        return response()->json(['message' => 'Member removed successfully.']);
    }

    public function update(UpdateChannelRequest $request, Channel $channel): RedirectResponse
    {
        abort_if($channel->type === 'direct', 403, 'Cannot edit a direct message channel.');

        $data = $request->validated();

        $this->channelService->updateChannel($channel, $data);

        return redirect()->route('channels.show', $channel->id);
    }

    public function destroy(Channel $channel): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user, 403);

        if (! $user->is_admin) {
            $isMember = $user->channels()->whereKey($channel->id)->exists();
            abort_unless($isMember, 403, 'Unauthorized');
        }

        if ($channel->type === 'group' && ! $user->is_admin) {
            $isOwner = $channel->owner_id === (int) $user->id;
            abort_unless($isOwner, 403, 'Only the channel owner can delete it.');
        }

        $channel->loadMissing('members:id,name');
        $channelLabel = $this->getChannelDeletionLabel($channel, (int) $user->id);

        $this->channelService->deleteChannel($channel);

        return response()->json([
            'message' => "{$channelLabel} was scheduled and will be deleted soon.",
        ]);
    }

    private function getChannelDeletionLabel(Channel $channel, int $currentUserId): string
    {
        if ($channel->type === 'direct') {
            $peerName = $channel->members
                ->firstWhere('id', '!=', $currentUserId)
                ?->name;

            return $peerName !== null
                ? "Chat with \"{$peerName}\""
                : 'Direct chat';
        }

        return "Channel \"{$channel->name}\"";
    }

    /**
     * Get shared attachments (excluding audio) for the channel.
     */
    public function attachments(Channel $channel): AnonymousResourceCollection
    {
        abort_unless(
            auth()->user()?->channels()->whereKey($channel->id)->exists(),
            403,
        );

        $attachments = $this->channelService->getChannelAttachments($channel);

        return MessageAttachmentResource::collection($attachments);
    }
}
