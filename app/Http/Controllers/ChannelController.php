<?php

namespace App\Http\Controllers;

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
        abort_if($channel->type === 'direct', 403, 'Cannot delete a direct message channel.');

        $isOwner = $channel->owner_id === (int) auth()->id();
        abort_unless(auth()->user()?->is_admin || $isOwner, 403, 'Only the channel owner can delete it.');

        $this->channelService->deleteChannel($channel);

        return response()->json([
            'message' => "Channel \"{$channel->name}\" was scheduled and will be deleted soon.",
        ]);
    }
}
