<?php

namespace App\Http\Controllers;

use App\Events\ChannelReadUpdated;
use App\Http\Requests\StoreChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Http\Resources\ChannelDetailResource;
use App\Http\Resources\ChannelResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Models\Channel;
use App\Models\User;
use App\Services\ChannelService;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
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
}
