<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Http\Resources\ChannelDetailResource;
use App\Http\Resources\ChannelResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Jobs\DeleteChannelJob;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;

class ChannelController extends Controller
{
    public function show(Channel $channel): Response
    {
        abort_unless(
            auth()->user()?->channels()->whereKey($channel->id)->exists(),
            403,
            'Unauthorized',
        );

        $messages = Message::where('channel_id', $channel->id)
            ->with(['sender', 'attachments', 'parent.sender'])
            ->latest()
            ->paginate(10);

        $channel->load(['members:id,name,avatar_url,is_admin,blocked_at']);

        return inertia('Home', [
            'channels' => ChannelResource::collection(
                Channel::getChannelsForUser(auth()->user())
            )->resolve(request()),
            'selectedChannel' => new ChannelDetailResource($channel),
            'messages' => MessageResource::collection($messages),
        ]);
    }

    public function store(StoreChannelRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $channel = Channel::create([
            'type' => 'group',
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_id' => $data['owner_id'],
        ]);

        $channel->members()->attach($data['user_ids']);

        return redirect()->route('channels.show', $channel->id);
    }

    public function findOrCreateDirect(User $user): RedirectResponse
    {
        $authUserId = (int) auth()->id();

        abort_if($authUserId === $user->id, 422, 'Cannot create DM with yourself.');

        if (!auth()->user()?->is_admin) {
            abort_if($user->blocked_at !== null, 403, 'Cannot message a blocked user.');
        }

        $channel = Channel::findOrCreateDirect($authUserId, $user->id);

        return redirect()->route('channels.show', $channel->id);
    }

    public function getMembers(Channel $channel): JsonResponse
    {
        abort_unless(
            auth()->user()?->channels()->whereKey($channel->id)->exists(),
            403,
        );
        $members = $channel->members()
            ->select('users.id', 'users.name', 'users.avatar_url', 'users.is_admin', 'users.blocked_at')
            ->get();

        return response()->json(UserResource::collection($members));
    }

    public function update(UpdateChannelRequest $request, Channel $channel): RedirectResponse
    {
        abort_if($channel->type === 'direct', 403, 'Cannot edit a direct message channel.');

        $data = $request->validated();

        $channel->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        $channel->members()->sync($data['user_ids']);

        return redirect()->route('channels.show', $channel->id);
    }

    public function destroy(Channel $channel): JsonResponse
    {
        abort_if($channel->type === 'direct', 403, 'Cannot delete a direct message channel.');

        $isOwner = $channel->owner_id === auth()->id();
        abort_unless(auth()->user()?->is_admin || $isOwner, 403, 'Only the channel owner can delete it.');

        DeleteChannelJob::dispatch($channel->id)->delay(now()->addSecond());

        return response()->json([
            'message' => "Channel \"{$channel->name}\" was scheduled and will be deleted soon.",
        ]);
    }
}
