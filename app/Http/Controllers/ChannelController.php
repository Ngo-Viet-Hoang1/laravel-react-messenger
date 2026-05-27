<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Jobs\DeleteChannelJob;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class ChannelController extends Controller
{
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

        return redirect()->route('chat.channel', $channel->id);
    }

    public function findOrCreateDirect(User $user): RedirectResponse
    {
        $authUserId = (int) auth()->id();

        abort_if($authUserId === $user->id, 422, 'Cannot create DM with yourself.');

        if (! auth()->user()?->is_admin) {
            abort_if($user->blocked_at !== null, 403, 'Cannot message a blocked user.');
        }

        $channel = Channel::findOrCreateDirect($authUserId, $user->id);

        return redirect()->route('chat.channel', $channel->id);
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

        return redirect()->route('chat.channel', $channel->id);
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
